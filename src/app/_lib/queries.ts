import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import { db } from "@/db"
import { tasks, type Task } from "@/db/schema"
import { and, asc, desc, inArray, or, sql } from "drizzle-orm"
import { type z } from "zod"

import { filterColumn } from "@/lib/filter-column"

import { type getTasksSchema } from "./validations"

export async function getTasks(input: z.infer<typeof getTasksSchema>) {
  noStore()
  try {
    const { page, per_page, sort, title, status, priority, operator } = input

    // Offset to paginate the results
    const offset = (page - 1) * per_page
    // Column and order to sort by
    // Spliting the sort string by "." to get the column and order
    // Example: "title.desc" => ["title", "desc"]
    const [column, order] = (sort?.split(".") as [
      keyof Task | undefined,
      "asc" | "desc" | undefined,
    ]) ?? ["title", "desc"]

    const statuses = (status?.split(".") as Task["status"][]) ?? []

    const priorities = (priority?.split(".") as Task["priority"][]) ?? []

    // Transaction is used to ensure both queries are executed in a single transaction
    const { data, count } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(tasks)
        .limit(per_page)
        .offset(offset)
        .where(
          !operator || operator === "and"
            ? and(
                // Filter tasks by title
                title
                  ? filterColumn({
                      column: tasks.title,
                      value: title,
                    })
                  : undefined,
                // Filter tasks by status
                statuses.length > 0
                  ? inArray(tasks.status, statuses)
                  : undefined,
                // Filter tasks by priority
                priorities.length > 0
                  ? inArray(tasks.priority, priorities)
                  : undefined
              )
            : or(
                // Filter tasks by title
                title
                  ? filterColumn({
                      column: tasks.title,
                      value: title,
                    })
                  : undefined,
                // Filter tasks by status
                statuses.length > 0
                  ? inArray(tasks.status, statuses)
                  : undefined,
                // Filter tasks by priority
                priorities.length > 0
                  ? inArray(tasks.priority, priorities)
                  : undefined
              )
        )
        .orderBy(
          column && column in tasks
            ? order === "asc"
              ? asc(tasks[column])
              : desc(tasks[column])
            : desc(tasks.id)
        )

      const count = await tx
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(tasks)
        .where(
          !operator || operator === "and"
            ? and(
                // Filter tasks by title
                title
                  ? filterColumn({
                      column: tasks.title,
                      value: title,
                    })
                  : undefined,
                // Filter tasks by status
                statuses.length > 0
                  ? inArray(tasks.status, statuses)
                  : undefined,
                // Filter tasks by priority
                priorities.length > 0
                  ? inArray(tasks.priority, priorities)
                  : undefined
              )
            : or(
                // Filter tasks by title
                title
                  ? filterColumn({
                      column: tasks.title,
                      value: title,
                    })
                  : undefined,
                // Filter tasks by status
                statuses.length > 0
                  ? inArray(tasks.status, statuses)
                  : undefined,
                // Filter tasks by priority
                priorities.length > 0
                  ? inArray(tasks.priority, priorities)
                  : undefined
              )
        )
        .execute()
        .then((res) => res[0]?.count ?? 0)

      return {
        data,
        count,
      }
    })

    const pageCount = Math.ceil(count / per_page)
    return { data, pageCount }
  } catch (err) {
    return { data: [], pageCount: 0 }
  }
}
