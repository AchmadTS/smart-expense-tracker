import { db } from "@/lib/db";
import { users, categories, transactions, budgets } from "@/schemas/schema";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Starting database seeding...");
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
            name: "Salary",
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
            name: "Food & Beverages",
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
            name: "Transportation",
            type: "expense",
            icon: "car",
            color: "#3B82F6",
            isDefault: true,
        })
        .returning();

    console.log("Created categories.");

    await db.insert(transactions).values([
        { userId: user.id, categoryId: salaryCat.id, amount: "8000000.00", type: "income", description: "August Salary", transactionDate: "2025-08-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1200000.00", type: "expense", description: "Monthly Groceries & Meals", transactionDate: "2025-08-10" },
        { userId: user.id, categoryId: transportCat.id, amount: "400000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2025-08-20" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8000000.00", type: "income", description: "September Salary", transactionDate: "2025-09-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1350000.00", type: "expense", description: "Food Delivery & Groceries", transactionDate: "2025-09-12" },
        { userId: user.id, categoryId: transportCat.id, amount: "450000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2025-09-18" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8000000.00", type: "income", description: "October Salary", transactionDate: "2025-10-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1100000.00", type: "expense", description: "Monthly Groceries", transactionDate: "2025-10-08" },
        { userId: user.id, categoryId: transportCat.id, amount: "420000.00", type: "expense", description: "Toll & Gasoline", transactionDate: "2025-10-22" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8000000.00", type: "income", description: "November Salary", transactionDate: "2025-11-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1450000.00", type: "expense", description: "Groceries & Eating Out", transactionDate: "2025-11-15" },
        { userId: user.id, categoryId: transportCat.id, amount: "380000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2025-11-25" },

        { userId: user.id, categoryId: salaryCat.id, amount: "12000000.00", type: "income", description: "December Salary + Bonus", transactionDate: "2025-12-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "2200000.00", type: "expense", description: "Holiday Meals & Groceries", transactionDate: "2025-12-10" },
        { userId: user.id, categoryId: transportCat.id, amount: "650000.00", type: "expense", description: "Holiday Travel & Gasoline", transactionDate: "2025-12-24" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8500000.00", type: "income", description: "January Salary (Adjustment)", transactionDate: "2026-01-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1250000.00", type: "expense", description: "Monthly Groceries", transactionDate: "2026-01-12" },
        { userId: user.id, categoryId: transportCat.id, amount: "400000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2026-01-20" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8500000.00", type: "income", description: "February Salary", transactionDate: "2026-02-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1150000.00", type: "expense", description: "Groceries & Snacks", transactionDate: "2026-02-14" },
        { userId: user.id, categoryId: transportCat.id, amount: "450000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2026-02-18" },

        { userId: user.id, categoryId: salaryCat.id, amount: "8500000.00", type: "income", description: "March Salary", transactionDate: "2026-03-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1500000.00", type: "expense", description: "Monthly Meals", transactionDate: "2026-03-10" },
        { userId: user.id, categoryId: transportCat.id, amount: "480000.00", type: "expense", description: "Toll & Gasoline", transactionDate: "2026-03-25" },

        { userId: user.id, categoryId: salaryCat.id, amount: "9000000.00", type: "income", description: "April Salary + THR", transactionDate: "2026-04-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1800000.00", type: "expense", description: "Iftar & Groceries", transactionDate: "2026-04-12" },
        { userId: user.id, categoryId: transportCat.id, amount: "550000.00", type: "expense", description: "Mudik/Travel Transport", transactionDate: "2026-04-28" },

        { userId: user.id, categoryId: salaryCat.id, amount: "9000000.00", type: "income", description: "May Salary", transactionDate: "2026-05-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1300000.00", type: "expense", description: "Monthly Groceries", transactionDate: "2026-05-15" },
        { userId: user.id, categoryId: transportCat.id, amount: "400000.00", type: "expense", description: "Gasoline & Commute", transactionDate: "2026-05-20" },

        { userId: user.id, categoryId: salaryCat.id, amount: "9000000.00", type: "income", description: "June Salary", transactionDate: "2026-06-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1200000.00", type: "expense", description: "June Meal", transactionDate: "2026-06-12" },
        { userId: user.id, categoryId: transportCat.id, amount: "400000.00", type: "expense", description: "Transport Juni", transactionDate: "2026-06-20" },

        { userId: user.id, categoryId: salaryCat.id, amount: "10000000.00", type: "income", description: "July Salary (Promotion)", transactionDate: "2026-07-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1500000.00", type: "expense", description: "Lunch & Restaurant", transactionDate: "2026-07-10" },
        { userId: user.id, categoryId: transportCat.id, amount: "450000.00", type: "expense", description: "Gasoline and Parking", transactionDate: "2026-07-15" },

        { userId: user.id, categoryId: salaryCat.id, amount: "10000000.00", type: "income", description: "August Salary", transactionDate: "2026-08-01" },
        { userId: user.id, categoryId: foodCat.id, amount: "1200000.00", type: "expense", description: "August Meal", transactionDate: "2026-08-01" },
        { userId: user.id, categoryId: transportCat.id, amount: "400000.00", type: "expense", description: "Transport August", transactionDate: "2026-08-01" },
    ]);

    console.log("Created transactions.");

    await db.insert(budgets).values([
        {
            userId: user.id,
            categoryId: foodCat.id,
            amount: "2000000.00",
            period: "monthly",
            startDate: "2026-08-01",
        },
        {
            userId: user.id,
            categoryId: transportCat.id,
            amount: "600000.00",
            period: "monthly",
            startDate: "2026-08-01",
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