const prisma = require("../lib/prisma");

const includeCompleto = {
  dono: { select: { id: true, nome: true, email: true, urlAvatar: true } },
  especie: true,
  admin: { select: { id: true, nome: true, email: true } },
  _count: { select: { entradasDiario: true, adocoes: true } },
};

// GET /plantas
const listar = async (req, res, next) => {
  try {
    const { donoId, especieId, disponivelParaAdocao, dificuldade, adminId } = req.query;

    const where = {};
    if (donoId) where.donoId = donoId;
    if (especieId) where.especieId = especieId;
    if (adminId) where.adminId = adminId;
    if (disponivelParaAdocao !== undefined) {
      where.disponivelParaAdocao = disponivelParaAdocao === "true";
    }
    if (dificuldade) {
      where.especie = { dificuldade };
    }

    const plantas = await prisma.planta.findMany({
      where,
      include: includeCompleto,
      orderBy: { adquiridaEm: "desc" },
    });

    return res.json({ status: "ok", total: plantas.length, dados: plantas });
  } catch (err) {
    next(err);
  }
};

// GET /plantas/:id
const buscarPorId = async (req, res, next) => {
  try {
    const planta = await prisma.planta.findUnique({
      where: { id: req.params.id },
      include: {
        ...includeCompleto,
        entradasDiario: {
          include: { autor: { select: { id: true, nome: true, urlAvatar: true } } },
          orderBy: { registradoEm: "desc" },
        },
        adocoes: {
          include: { cuidador: { select: { id: true, nome: true, urlAvatar: true } } },
          orderBy: { dataInicio: "desc" },
        },
      },
    });

    if (!planta) {
      return res.status(404).json({ status: "erro", mensagem: "Planta não encontrada" });
    }

    return res.json({ status: "ok", dados: planta });
  } catch (err) {
    next(err);
  }
};

// POST /plantas
const criar = async (req, res, next) => {
  try {
    const dados = {
      ...req.body,
      donoId: req.authTipo === "usuario" ? req.usuarioId : req.body.donoId,
      adminId: req.authTipo === "admin" ? req.body.adminId : undefined,
    };

    const planta = await prisma.planta.create({
      data: dados,
      include: includeCompleto,
    });

    return res.status(201).json({ status: "ok", dados: planta });
  } catch (err) {
    next(err);
  }
};

// PATCH /plantas/:id
const atualizar = async (req, res, next) => {
  try {
    if (req.authTipo === "usuario") {
      const plantaExistente = await prisma.planta.findUnique({
        where: { id: req.params.id },
        select: { donoId: true },
      });

      if (!plantaExistente) {
        return res.status(404).json({ status: "erro", mensagem: "Planta não encontrada" });
      }

      if (plantaExistente.donoId !== req.usuarioId) {
        return res.status(403).json({ status: "erro", mensagem: "Você só pode editar suas próprias plantas" });
      }
    }

    const planta = await prisma.planta.update({
      where: { id: req.params.id },
      data: req.body,
      include: includeCompleto,
    });

    return res.json({ status: "ok", dados: planta });
  } catch (err) {
    next(err);
  }
};

// DELETE /plantas/:id
const remover = async (req, res, next) => {
  try {
    await prisma.planta.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
