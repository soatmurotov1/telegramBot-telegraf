import { Injectable } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
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


const ADMIN_IDS: number[] = (process.env.ADMIN_IDS || '').split(',').map((id) => Number(id.trim())).filter(Boolean)
interface Channel { 
  name: string
  username: string 
}


const CHANNELS: Channel[] = [
  { name: "Toward Coder", username: "@toward_coder" },
  { name: "Japanse Najot Talim", username: "@japanse_najot_talim" }
]

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  private async checkSubscriptions( ctx: Context, userId: number ): Promise<Channel[]> {
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
    if (!userId) 
    return
    const notSubscribed = await this.checkSubscriptions(ctx, userId) 

    if (notSubscribed.length > 0) {
      const buttons = notSubscribed.map((c) =>Markup.button.url( c.name,
      `https://t.me/${c.username.replace("@", "")}`
        )
      )

      await ctx.reply(
        "Quyidagi kanallarga obuna bo'ling:",
        Markup.inlineKeyboard( [...buttons, Markup.button.callback("✅ Tekshirish", "check")], { columns: 1 })
      )
      return
    }

    await this.redis.setSession(userId, { step: "ask_name", data: {} })
    await ctx.reply("Ismingizni kiriting:")
  }

  @On("callback_query")
  async onCallback(@Ctx() ctx: Context) {
    const userId = ctx.from?.id
    const data = ctx.callbackQuery?.["data"]
    if (!userId || !data) 
      return

    if (data === "check") {
      const notSubscribed = await this.checkSubscriptions(ctx, userId)
      if (notSubscribed.length > 0) {
        await ctx.answerCbQuery("❌ Hali hamma kanalga obuna bo'lmadingiz")
        return
      }

      await this.redis.setSession(userId, { step: "ask_name", data: {} })
      await ctx.reply("✅ Rahmat! Ismingizni kiriting:")
      return
    }

    const session = await this.redis.getSession(userId)
    if (!session) return

    if (session.step === "region") {
      const districts = REGIONS[data]
      if (!districts) {
        await ctx.answerCbQuery("Noto'g'ri viloyat tanlandi")
        return
      }

      session.data.region = data
      session.step = "district"
      await this.redis.setSession(userId, session)

      await ctx.editMessageText(
        "Tumanni tanlang:",
        Markup.inlineKeyboard(districts.map((d) => Markup.button.callback(d, d)), { columns: 1 })
      )
      return
    }
    console.log("ADMIN_IDS:", ADMIN_IDS)

    if (session.step === "district") {
    session.data.district = data 

    const user = await this.prisma.user.create({
        data: session.data
    })

    const telegramUser = ctx.from
    const telegramName = telegramUser.username ? `@${telegramUser.username}`
    : `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim()

    for (const adminId of ADMIN_IDS) {
        await ctx.telegram.sendMessage(
            adminId,
            `
            🆕 <b>Yangi foydalanuvchi</b>

            👤 Ism: ${user.name}
            🎂 Yosh: ${user.age}
            📞 Telefon: ${user.phone}
            🌍 Viloyat: ${user.region}
            🏘️ Tuman: ${user.district}
            🆔 Telegram: ${telegramName}
            `,
            { parse_mode: "HTML" }
        )
    }

    await ctx.reply(
        `
        📋 <b>Sizning malumotlaringiz</b>

        👤 Ism: ${user.name}
        🎂 Yosh: ${user.age}
        📞 Telefon: ${user.phone}
        🌍 Viloyat: ${user.region}
        🏘️ Tuman: ${user.district}
        🆔 Telegram: ${telegramName}
        `, 
        { parse_mode: "HTML"}
    )

    await this.redis.deleteSession(userId)
}

  }

  @On("message")
  async onMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id 
    if (!userId) return

    const session = await this.redis.getSession(userId)
    if (!session) return 

    const text = ctx.message?.["text"]  
    const contact = ctx.message?.["contact"] 

    switch (session.step) {
      case "ask_name":
      if (!text) 
        return
      session.data.name = text
      session.step = "ask_age"
      await this.redis.setSession(userId, session)
      await ctx.reply("Yoshingizni kiriting:", Markup.removeKeyboard())
    break

case "ask_age":
    const age = Number(text)
    if (isNaN(age)) {
        await ctx.reply('Yoshingizni raqam bilan kiriting', Markup.removeKeyboard())
        return
    }
    session.data.age = age
    session.step = "ask_phone"
    await this.redis.setSession(userId, session)
    await ctx.reply(
        "Telefon raqamingizni yuboring:",
        Markup.keyboard([Markup.button.contactRequest('📞 Raqamni yuborish')]).resize().oneTime()
    )
    break

case "ask_phone":
    session.data.phone = contact?.phone_number || text
    session.step = "region"
    await this.redis.setSession(userId, session)

    await ctx.reply(
        "Viloyatingizni tanlang:",
        Markup.inlineKeyboard(
            Object.keys(REGIONS).map((r) => Markup.button.callback(r, r)),
            { columns: 1 }
        )
    )
    break

    }
  }
}


