import { Injectable } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { TestService } from 'src/test/test.service';
import { Context, Markup } from 'telegraf';

const REGIONS: Record<string, string[]> = {
  Andijon: [
    'Andijon',
    'Asaka',
    'Baliqchi',
    'Buloqboshi',
    'Izboskan',
    'Jalaquduq',
    'Marhamat',
    "Oltinko'l",
    'Paxtaobod',
    'Shahrixon',
    "Ulug'nor",
  ],
  Buxoro: [
    'Buxoro sh.',
    'Buxoro tum.',
    'Olot',
    "G'ijduvon",
    'Jondor',
    'Kogon',
    "Qorako'l",
    'Qorovulbozor',
    'Peshku',
    'Romitan',
    'Shofirkon',
    'Vobkent',
  ],
  "Farg'ona": [
    "Farg'ona sh.",
    "Farg'ona tum.",
    'Beshariq',
    'Buvayda',
    "Dang'ara",
    "Marg'ilon",
    'Oltiariq',
    'Rishton',
    'Toshloq',
    'Uchkuprik',
    "Qo'qon",
    'Quva',
    'Yozyovon',
  ],
  Jizzax: [
    'Jizzax sh.',
    'Arnasoy',
    'Baxmal',
    "G'allaorol",
    'Zarbdor',
    'Zomin',
    'Forish',
    'Yangiobod',
  ],
  Namangan: [
    'Namangan sh.',
    'Namangan tum.',
    'Chortoq',
    'Kosonsoy',
    'Mingbuloq',
    'Norin',
    'Pop',
    "To'raqo'rg'on",
    'Uychi',
    "Uchqo'rg'on",
  ],
  Navoiy: [
    'Navoiy sh.',
    'Karmana',
    'Kyzyltepa',
    'Navbahor',
    'Nurota',
    "Tog'uzko'l",
    'Uchquduq',
    'Xatirchi',
  ],
  Qashqadaryo: [
    'Qarshi sh.',
    "G'uzor",
    'Dehqonobod',
    'Koson',
    'Mirishkar',
    'Nishon',
    'Qamashi',
    'Qarshi tum.',
    'Shahrisabz',
    "Yakkabog'",
  ],
  Samarqand: [
    'Samarqand sh.',
    "Bulung'ur",
    'Jomboy',
    'Ishtixon',
    "Kattaqo'rg'on",
    'Narpay',
    'Nurobod',
    'Payariq',
    "Pastdarg'om",
    'Urgut',
  ],
  Sirdaryo: [
    'Guliston sh.',
    'Boyovut',
    'Guliston tum.',
    'Mirzaobod',
    'Sardoba',
    'Sayxunobod',
    'Baxt',
  ],
  Surxondaryo: [
    'Termiz sh.',
    'Angor',
    'Bandixon',
    'Boysun',
    'Denov',
    "Jarqo'rg'on",
    'Kumkurgan',
    'Muzrabot',
    'Sariasiya',
    'Sherobod',
    "Sho'rchi",
  ],
  'Toshkent (viloyat)': [
    'Toshkent viloyati sh.',
    'Ahangaran',
    'Bekobod',
    "Bo'ka",
    'Bostanliq',
    'Chinoz',
    'Parkent',
    'Piskent',
    'Qibray',
    "Oqqo'rg'on",
    "Yangiyo'l",
    'Zangiota',
    'Olmaliq',
    "Bo'stonliq",
  ],
  Xorazm: [
    'Urganch sh.',
    "Bog'ot",
    'Gurlen',
    'Hazorasp',
    'Khanka',
    "Qo'shko'pir",
    'Shavat',
    'Yangibozor',
  ],
  'Toshkent shahar': [
    'Chilonzor',
    "Mirzo Ulug'bek",
    'Yunusobod',
    'Olmazor',
    'Bektemir',
    'Sergeli',
    'Mirobod',
    'Uchtepa',
    'Yakkasaray',
    'Hamza',
    'Shayxontohur',
  ],
  "Qoraqalpog'iston": [
    'Nukus sh.',
    'Amudaryo',
    'Beruniy',
    'Chimboy',
    'Ellikqala',
    'Kegeyli',
    "Mo'ynoq",
    "Qorao'zak",
    "Qaniko'l",
    'Shumanay',
    "Taxtako'pir",
    'Taxiatosh',
    "Qo'ngirot",
    "To'rtko'l",
    "Xo'jayli",
  ],
}

const ADMIN_IDS: number[] = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => Number(id.trim()))
  .filter(Boolean)

interface Channel {
  name: string
  username: string
}
const CHANNELS: Channel[] = [
  { name: "Toward Coder", username: "@toward_coder" },
  { name: "Japanese Najot Talim", username: "@japanse_najot_talim" }
]

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly testService: TestService
  ) {}

  private async checkSubscriptions( ctx: Context, userId: number): Promise<Channel[]> {
    const notSubscribed: Channel[] = []
    for (const channel of CHANNELS) {
      try {
        const member = await ctx.telegram.getChatMember(
          channel.username,
          userId
        )
        if (!["member", "administrator", "creator"].includes(member.status)) {
          notSubscribed.push(channel)
        }
      } catch (e) {
        notSubscribed.push(channel)
      }
    }
    return notSubscribed
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    if (!userId) {
      return
    }

    const notSubscribed = await this.checkSubscriptions(ctx, userId);
    if (notSubscribed.length > 0) {
      const buttons = notSubscribed.map((c) => [
        Markup.button.url(
          c.name,
          `https://t.me/${c.username.replace('@', "")}`
        )
      ])
      await ctx.reply(
        "Davom etish uchun quyidagi kanallarga obuna bo'ling:",
        Markup.inlineKeyboard([
          ...buttons,
          [Markup.button.callback('✅ Tekshirish', 'check')]
        ])
      )
    }

    await this.redis.setSession(userId, { step: 'ask_name', data: {} })
    await ctx.reply("Xush kelibsiz! Ismingizni kiriting:", Markup.removeKeyboard())
  }

  @On("callback_query")
  async onCallback(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    const query = ctx.callbackQuery as any
    const data = query?.data
    if (!userId || !data) {
      return
    }

    if (data === "check") {
      const notSubscribed = await this.checkSubscriptions(ctx, userId);
      if (notSubscribed.length > 0) {
        await ctx.answerCbQuery(
          "❌ Hali hamma kanalga obuna bo'lmadingiz",
          { show_alert: true }
        )
      }
      await ctx.answerCbQuery('✅ Rahmat!')
      await this.redis.setSession(userId, { step: 'ask_name', data: {} })
      await ctx.reply('Ismingizni kiriting:')
      return
    }

    const session = await this.redis.getSession(userId)
    if (!session) {
      return
    }

    if (session.step === "region") {
      const districts = REGIONS[data]
      if (!districts) return await ctx.answerCbQuery("Xato")
      session.data.region = data
      session.step = "district"
      await this.redis.setSession(userId, session)
      await ctx.editMessageText(
        "Tumanni tanlang:",
        Markup.inlineKeyboard(
          districts.map((d) => Markup.button.callback(d, d)),
          { columns: 2 },
        )
      )
    } else if (session.step === "district") {
      session.data.district = data
      await this.prisma.user.create({
        data: {
          telegramId: BigInt(userId),
          name: session.data.name,
          age: Number(session.data.age),
          phone: session.data.phone,
          region: session.data.region,
          district: session.data.district
        }
      })
      await ctx.reply(`✅ Rahmat ${session.data.name}, ro'yxatdan o'tdingiz!`)
      await this.redis.deleteSession(userId)
    }
  }

  @On("message")
  async onMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    const message = ctx.message as any
    const text = message?.text
    const contact = message?.contact
    if (!userId) return

    if (ADMIN_IDS.includes(userId) && text === "/create_test") {
      await this.redis.setSession(userId, {
        step: "test_code",
        data: {}
      })
      await ctx.reply("Test kodini kiriting:")
      return 
    }
  
    const session = await this.redis.getSession(userId)
    if (!session) {
      if (text && text.includes("-")) {
        const result = await this.testService.checkAnswer(userId, text)
        await ctx.reply(result)
      }
      return
    }

    switch (session.step) {
      case "ask_name":
        session.data.name = text
        session.step = "ask_age"
        await this.redis.setSession(userId, session)
        await ctx.reply("Yoshingizni kiriting:")
          return

      case "ask_age":
        const age = Number(text)
        if (isNaN(age)) {
          await ctx.reply("Raqam kiriting:")
        }
        session.data.age = age
        session.step = "ask_phone"
        await this.redis.setSession(userId, session)
        await ctx.reply(
          "Raqamni yuboring:",
          Markup.keyboard([[Markup.button.contactRequest("📞 Yuborish")]])
            .resize()
            .oneTime()
        )
        return

      case "ask_phone":
        session.data.phone = contact?.phone_number || text
        session.step = "region"
        await this.redis.setSession(userId, session)
        await ctx.reply(
          "Viloyat tanlang:",
          Markup.inlineKeyboard(
            Object.keys(REGIONS).map((r) => Markup.button.callback(r, r)),
            { columns: 2 }
          )
        )
        return

      case "test_code":
        session.data.code = text
        session.step = "admin_test_ans"
        await this.redis.setSession(userId, session)
        await ctx.reply('Javoblarni kiriting (absaac...):')
        return

      case "admin_test_ans":
        session.data.answers = text
        session.step = "admin_test_time"
        await this.redis.setSession(userId, session)
        await ctx.reply("Vaqtni kiriting: (2025-12-12 12:12 / 2025-12-12 20:00)")
        return
      case "admin_test_time":
        try {
          const times = text.split("/")
          const start = new Date(times[0].trim())
          const end = new Date(times[1].trim())
          const test = await this.testService.createTest(
            session.data.code, 
            session.data.answers, 
            start, 
            end
        )
        await this.redis.deleteSession(userId)
        await ctx.reply(`✅ Test yaratildi: ${test.code}`)
        const users = await this.prisma.user.findMany()
        const broad=
        `<b>Yangi test boshlandi!</b>\n\n` +
        `Kod: <code>${test.code}</code>\n`+
        `Boshlanish vaqti: ${test.startTime}\n\n`+
        `Tugash vaqti: ${test.endTime}\n\n` +
        `Javoblarni <code>${test.code}-abcd...</code> ko'rinishida yuboring!`
        for (const u of users) {
          try {
            await ctx.telegram.sendMessage(Number(u.telegramId), broad, { parse_mode: "HTML" })
          } catch (e) {
            console.error(`User ${u.telegramId} botni bloklagan.`)
          }
        }
        await ctx.reply(`Xabar ${users.length} ta foydalanuvchiga yuborildi.`)
      } catch (error) {
        console.error("Test yaratishda xato:", error)
        await ctx.reply("❌ Xatolik! Vaqt formatini tekshiring (YYYY-MM-DD HH:mm / YYYY-MM-DD HH:mm)")
      }
      break
    }
  }
}


