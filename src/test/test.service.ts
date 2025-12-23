import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TestService {
    constructor(private prisma: PrismaService) {}

    async createTest(code: string, answers: string, start: Date, end: Date) {
        return await this.prisma.test.create({
            data: {
                code,
                answers,
                startTime: start, 
                endTime: end   
            }
        })
    }

    async checkAnswer(userId: number, text: string): Promise<string> {
        const parts = text.split('-');
        if (parts.length !== 2) return "Format noto'g'ri. Namuna: 354654-abcd"
        const [code, userAnswers] = parts
        const test = await this.prisma.test.findUnique({ where: { code } })

        if (!test) {
            return "Bunday kodli test topilmadi."
        }
        
        const now = new Date()
        if (now < test.startTime) {
            return "Test hali boshlanmadi."
        }
        if (now > test.endTime) {
            return "Test yakunlangan."
        }

        let correctCount = 0
        const correctAnswers = test.answers.toLowerCase()
        const userAns = userAnswers.toLowerCase()
        const checkLen = Math.min(correctAnswers.length, userAns.length)
        for (let i = 0; i < checkLen; i++) {
            if (correctAnswers[i] === userAns[i]) correctCount++
        }
        return `Test natijasi:\n
        Kod: ${code}
        To'g'ri: ${correctCount}
        Xato: ${correctAnswers.length - correctCount}
        TOTAL: ${correctAnswers.length} ta`
    }
}