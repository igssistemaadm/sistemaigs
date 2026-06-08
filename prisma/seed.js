import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";
const prisma = new PrismaClient();
const users = [
    { name: "Alex", username: "alex", password: "alex", role: UserRole.ADMIN },
    { name: "Ismael", username: "ismael", password: "ismael", role: UserRole.ADMIN },
    { name: "Mika", username: "mika", password: "mika", role: UserRole.USER },
    { name: "Daisa", username: "daisa", password: "daisa", role: UserRole.USER },
];
async function main() {
    for (const user of users) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {
                name: user.name,
                role: user.role,
                active: true,
            },
            create: {
                name: user.name,
                username: user.username,
                passwordHash: await hashPassword(user.password),
                role: user.role,
            },
        });
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
