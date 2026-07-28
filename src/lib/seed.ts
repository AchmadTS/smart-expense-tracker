import { db } from "@/lib/db";
import { users, categories, transactions, budgets } from "@/schemas/schema";
import bcrypt from "bcryptjs";

async function main() {
    console.log("🌱 Starting database seeding...");
    const passwordHash = await bcrypt.hash("$aTs130425.", 10);
    const [user] = await db
        .insert(users)
        .values({
            name: "Achmad Tirto Sudiro",
            email: "achmadtirtosudirosudiro@gmail.com",
            passwordHash,
            currency: "IDR",
        })
        .returning();

    console.log(`Created user: ${user.name} (ID: ${user.id})`);

    const [salaryCat] = await db
        .insert(categories)
        .values({
            userId: user.id,
            name: "Gaji",
            type: "income",
            icon: "briefcase",
            color: "#10B981",
            isDefault: true,
        })
        .returning();

    const [foodCat] = await db
        .insert(categories)
        .values({
            userId: user.id,
            name: "Makanan & Minuman",
            type: "expense",
            icon: "utensils",
            color: "#F59E0B",
            isDefault: true,
        })
        .returning();

    const [transportCat] = await db
        .insert(categories)
        .values({
            userId: user.id,
            name: "Transportasi",
            type: "expense",
            icon: "car",
            color: "#3B82F6",
            isDefault: true,
        })
        .returning();

    console.log("Created categories.");

    await db.insert(transactions).values([
        {
            userId: user.id,
            categoryId: salaryCat.id,
            amount: "8000000.00",
            type: "income",
            description: "Gaji Juni",
            transactionDate: "2026-06-01",
        },
        {
            userId: user.id,
            categoryId: foodCat.id,
            amount: "1200000.00",
            type: "expense",
            description: "Makan Bulan Juni",
            transactionDate: "2026-06-12",
        },
        {
            userId: user.id,
            categoryId: transportCat.id,
            amount: "400000.00",
            type: "expense",
            description: "Transport Juni",
            transactionDate: "2026-06-20",
        },

        {
            userId: user.id,
            categoryId: salaryCat.id,
            amount: "10000000.00",
            type: "income",
            description: "Gaji Bulanan",
            transactionDate: "2026-07-01",
        },
        {
            userId: user.id,
            categoryId: foodCat.id,
            amount: "1500000.00",
            type: "expense",
            description: "Makan Siang & Resto",
            transactionDate: "2026-07-10",
        },
        {
            userId: user.id,
            categoryId: transportCat.id,
            amount: "450000.00",
            type: "expense",
            description: "Bensin & Parkir",
            transactionDate: "2026-07-15",
        },
    ]);

    console.log("Created transactions.");

    await db.insert(budgets).values([
        {
            userId: user.id,
            categoryId: foodCat.id,
            amount: "2000000.00",
            period: "monthly",
            startDate: "2026-07-01",
        },
        {
            userId: user.id,
            categoryId: transportCat.id,
            amount: "600000.00",
            period: "monthly",
            startDate: "2026-07-01",
        },
    ]);

    console.log("Created budgets.");
    console.log("✅ Seeding completed successfully!");
}

main()
    .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    });