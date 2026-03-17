import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("todos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    text: {
      type: "text",
      notNull: true,
    },
    completed: {
      type: "boolean",
      default: false,
    },
    created_at: {
      type: "timestamptz",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("todos", "created_at", { name: "idx_todos_created_at" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("todos");
}
