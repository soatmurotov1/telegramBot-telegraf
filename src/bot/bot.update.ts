import { Injectable } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { Context, Markup } from 'telegraf';

interface UserSession {
  step: string
  data: any
}

const sessions = new Map<number, UserSession>()
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
    'Shumanay',
    "Taxtako'pir",
    'Taxiatosh',
  ],
};

const REQUIRED_CHANNELS = [
  { name: "Toward Coder", url: "https://t.me/toward_coder" },
  { name: "Yapon tili", url: "https://t.me/japanse_najot_talim" },
]

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    if (!userId) {
      return
    }

    const channelButtons = REQUIRED_CHANNELS.map((c) =>
      Markup.button.url(c.name, c.url),
    )
    const checkButton = Markup.button.callback(
      "Obunani tekshirish ✅",
      "check"
    )

    await ctx.reply(
      "Quyidagi kanallarga obuna bo'ling",
      Markup.inlineKeyboard([...channelButtons, checkButton], { columns: 1 })
    )
  }

  @On("callback_query")
  async onCallback(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    const callbackQuery = ctx.update?.["callback_query"]
    if (!userId || !callbackQuery || !('data' in callbackQuery)) {
      return
    }

    let session = await this.redisService.getSession(userId)

    if (callbackQuery.data === "check") {
      session = { step: 'ask_name', data: {} }
      await this.redisService.setSession(userId, session)
      await ctx.reply("Iltimos, ismingizni kiriting:")
      return
    }

    if (!session) {
      return
    }
    if (session.step === "region") {
      session.data.region = callbackQuery.data
      session.step = "district"
      await this.redisService.setSession(userId, session)
      const districts = REGIONS[session.data.region] || []
      await ctx.editMessageText(
        "Tumanni tanlang:",
        Markup.inlineKeyboard(
          districts.map((d) => Markup.button.callback(d, d)),
          { columns: 1 }
        )
      )
      return
    } else if (session.step === "district") {
      session.data.district = callbackQuery.data
      this.prisma.user.create({ data: session.data }).catch(console.error)

      await ctx.reply(
        `
        📋 <b>Sizning ma'lumotlaringiz:</b>

        👤 Foydalanuvchi: ${ctx.from.username ? '@' + ctx.from.username : ctx.from.first_name}
        👨‍💼 Ism: ${session.data.name}
        🎂 Yosh: ${session.data.age} yosh
        📞 Telefon: ${session.data.phone}
        🌐 Viloyat: ${session.data.region}
        🏘️ Tuman: ${session.data.district}
        `,
        { parse_mode: 'HTML' },
      )
      await this.redisService.deleteSession(userId)
    }
  }

  @On("message")
  async onMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id 
    if (!userId) {
      return 
    }
    let session = await this.redisService.getSession(userId)
    if (!session) { 
      return 
    }

    const text = ctx.message?.["text"] 
    const contact = ctx.message?.["contact"] 

    switch (session.step) {
      case "ask_name":
        if (!text) return ctx.reply("Iltimos, ismingizni yozing:")
        session.data.name = text 
        session.step = "ask_age"
        await this.redisService.setSession(userId, session)
        await ctx.reply("Yoshingizni kiriting:")
        return

      case "ask_age": {
        const age = parseInt(text ?? "")
        if (isNaN(age)) {
          await ctx.reply("Iltimos, yoshingizni raqam bilan kiriting:")
          return
        }
        session.data.age = age
        session.step = "ask_phone"
        await this.redisService.setSession(userId, session)
        await ctx.reply(
          "Telefon raqamingizni yuboring:",
          Markup.keyboard([Markup.button.contactRequest("📞 Raqamni yuborish")]).resize().oneTime()
        )
        return
      }

      case "ask_phone": {
        if (contact) {
          session.data.phone = contact.phone_number
        } else if (text) {
          session.data.phone = text
        } else {
          await ctx.reply("Iltimos, telefon raqamingizni yuboring:")
          return
        }

        session.step = "region"
        await this.redisService.setSession(userId, session)
        await ctx.reply('Viloyatingizni tanlang:', {
          reply_markup: {
            remove_keyboard: true,
          }
        })

        await ctx.reply(
          "Viloyatingizni tanlang:",
          Markup.inlineKeyboard(
            Object.keys(REGIONS).map((region) =>
              Markup.button.callback(region, region)
            ),
            { columns: 1 }
          )
        )

        return
      }

      case 'region':
      case 'district':
        break
    }
  }
}


