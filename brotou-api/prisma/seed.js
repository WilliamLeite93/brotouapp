const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Admin ───────────────────────────────────────────────
  const senhaHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@brotou.app" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@brotou.app",
      senha: senhaHash,
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // ─── Espécies ─────────────────────────────────────────────
  const especies = await Promise.all([
    prisma.especie.upsert({
      where: { id: "esp_monstera" },
      update: {
        urlFoto: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80",
      },
      create: {
        id: "esp_monstera",
        nomeComum: "Costela-de-Adão",
        nomeCientifico: "Monstera deliciosa",
        urlFoto: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80",
        dicaRega: "A cada 7 dias, solo levemente úmido",
        dicaLuz: "Luz indireta brilhante, sem sol direto",
        dificuldade: "FACIL",
      },
    }),
    prisma.especie.upsert({
      where: { id: "esp_cacto" },
      update: {
        urlFoto: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&q=80",
      },
      create: {
        id: "esp_cacto",
        nomeComum: "Cacto",
        nomeCientifico: "Cactaceae",
        urlFoto: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&q=80",
        dicaRega: "A cada 21 dias, solo completamente seco",
        dicaLuz: "Sol direto por pelo menos 6 horas",
        dificuldade: "FACIL",
      },
    }),
    prisma.especie.upsert({
      where: { id: "esp_samambaia" },
      update: {
        urlFoto: "https://images.unsplash.com/photo-1585058178215-33108215e3c8?w=500&q=80",
      },
      create: {
        id: "esp_samambaia",
        nomeComum: "Samambaia",
        nomeCientifico: "Nephrolepis exaltata",
        urlFoto: "https://images.unsplash.com/photo-1585058178215-33108215e3c8?w=500&q=80",
        dicaRega: "A cada 2 a 3 dias, manter solo úmido",
        dicaLuz: "Sombra ou luz difusa",
        dificuldade: "MEDIO",
      },
    }),
    prisma.especie.upsert({
      where: { id: "esp_orquidea" },
      update: {
        urlFoto: "https://images.unsplash.com/photo-1566907225475-877b77ec1d22?w=500&q=80",
      },
      create: {
        id: "esp_orquidea",
        nomeComum: "Orquídea",
        nomeCientifico: "Orchidaceae",
        urlFoto: "https://images.unsplash.com/photo-1566907225475-877b77ec1d22?w=500&q=80",
        dicaRega: "A cada 5 a 7 dias, imersão rápida",
        dicaLuz: "Luz indireta, evitar sol direto",
        dificuldade: "DIFICIL",
      },
    }),
    prisma.especie.upsert({
      where: { id: "esp_pothos" },
      update: {
        urlFoto: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=500&q=80",
      },
      create: {
        id: "esp_pothos",
        nomeComum: "Pothos",
        nomeCientifico: "Epipremnum aureum",
        urlFoto: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=500&q=80",
        dicaRega: "A cada 7 a 10 dias, solo quase seco",
        dicaLuz: "Baixa a média luminosidade",
        dificuldade: "FACIL",
      },
    }),
  ]);
  console.log(`✅ ${especies.length} espécies criadas`);

  // ─── Usuários ─────────────────────────────────────────────
  const senhaUsuarioHash = await bcrypt.hash("Usuario123", 12);

  const ana = await prisma.usuario.upsert({
    where: { email: "ana@email.com" },
    update: { username: "ana.silva", senha: senhaUsuarioHash },
    create: {
      nome: "Ana Silva",
      username: "ana.silva",
      email: "ana@email.com",
      senha: senhaUsuarioHash,
      urlAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=180&q=80",
      adminId: admin.id,
    },
  });

  const carlos = await prisma.usuario.upsert({
    where: { email: "carlos@email.com" },
    update: { username: "carlos.lima", senha: senhaUsuarioHash },
    create: {
      nome: "Carlos Lima",
      username: "carlos.lima",
      email: "carlos@email.com",
      senha: senhaUsuarioHash,
      urlAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&q=80",
      adminId: admin.id,
    },
  });
  console.log("✅ Usuários criados: Ana, Carlos");

  // ─── Plantas ──────────────────────────────────────────────
  const monstera = await prisma.planta.upsert({
    where: { id: "plt_monstera_ana" },
    update: {},
    create: {
      id: "plt_monstera_ana",
      apelido: "Monstera da Sala",
      urlFoto: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80",
      adquiridaEm: new Date("2023-03-15"),
      disponivelParaAdocao: true,
      donoId: ana.id,
      especieId: "esp_monstera",
      adminId: admin.id,
    },
  });

  const cacto = await prisma.planta.upsert({
    where: { id: "plt_cacto_carlos" },
    update: {},
    create: {
      id: "plt_cacto_carlos",
      apelido: "Cacto Guerreiro",
      urlFoto: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&q=80",
      adquiridaEm: new Date("2022-06-01"),
      disponivelParaAdocao: false,
      donoId: carlos.id,
      especieId: "esp_cacto",
      adminId: admin.id,
    },
  });

  const samambaia = await prisma.planta.upsert({
    where: { id: "plt_samambaia_carlos" },
    update: {},
    create: {
      id: "plt_samambaia_carlos",
      apelido: "Samambaia Mimosa",
      urlFoto: "https://images.unsplash.com/photo-1585058178215-33108215e3c8?w=500&q=80",
      adquiridaEm: new Date("2024-04-10"),
      disponivelParaAdocao: true,
      donoId: carlos.id,
      especieId: "esp_samambaia",
      adminId: admin.id,
    },
  });
  console.log("✅ Plantas criadas: Monstera, Cacto, Samambaia");

  // ─── Entradas do Diário ───────────────────────────────────
  await prisma.entradaDiario.createMany({
    skipDuplicates: true,
    data: [
      {
        tipo: "REGA",
        observacao: "Regada com 500ml de água filtrada. Solo estava completamente seco.",
        registradoEm: new Date("2024-07-20T08:32:00"),
        plantaId: monstera.id,
        autorId: ana.id,
      },
      {
        tipo: "ADUBACAO",
        observacao: "Adubo líquido NPK diluído em 2L. Folhas com aspecto excelente.",
        registradoEm: new Date("2024-07-15T19:15:00"),
        plantaId: monstera.id,
        autorId: ana.id,
      },
      {
        tipo: "OBSERVACAO",
        observacao: "Nova folha surgindo no lado esquerdo! Crescendo muito bem.",
        registradoEm: new Date("2024-07-10T14:00:00"),
        plantaId: samambaia.id,
        autorId: carlos.id,
      },
      {
        tipo: "PODA",
        observacao: "Removida folha amarelada na base. Planta com ótima aparência.",
        registradoEm: new Date("2024-07-01T11:00:00"),
        plantaId: monstera.id,
        autorId: ana.id,
      },
      {
        tipo: "REGA",
        observacao: "Rega abundante com drenagem total. Solo estava completamente seco.",
        registradoEm: new Date("2024-06-28T10:00:00"),
        plantaId: cacto.id,
        autorId: carlos.id,
      },
    ],
  });
  console.log("✅ Entradas do diário criadas");

  // ─── Adoções ──────────────────────────────────────────────
  await prisma.adocao.create({
    data: {
      dataInicio: new Date("2024-07-10"),
      status: "ATIVA",
      plantaId: samambaia.id,
      cuidadorId: ana.id,
    },
  });
  console.log("✅ Adoção criada");

  console.log("\n🌿 Seed concluído com sucesso!");
  console.log("─────────────────────────────");
  console.log("Admin:    admin@brotou.app / admin123");
  console.log("Usuário:  ana@email.com / Usuario123");
  console.log("Usuário:  carlos@email.com / Usuario123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
