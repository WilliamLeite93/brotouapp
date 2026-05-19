const { z } = require("zod");

const dificuldadeEnum = z.enum(["FACIL", "MEDIO", "DIFICIL"], {
  errorMap: () => ({ message: "Dificuldade deve ser FACIL, MEDIO ou DIFICIL" }),
});

const criarEspecieSchema = z.object({
  nomeComum: z.string().min(2, "Nome comum deve ter no mínimo 2 caracteres").max(100),
  nomeCientifico: z.string().min(2, "Nome científico deve ter no mínimo 2 caracteres").max(150),
  urlFoto: z.string().url("URL da foto inválida").optional().or(z.literal("")),
  dicaRega: z.string().min(5, "Dica de rega deve ter no mínimo 5 caracteres").max(300),
  dicaLuz: z.string().min(5, "Dica de luz deve ter no mínimo 5 caracteres").max(300),
  dificuldade: dificuldadeEnum,
});

const atualizarEspecieSchema = criarEspecieSchema.partial();

module.exports = { criarEspecieSchema, atualizarEspecieSchema, dificuldadeEnum };
