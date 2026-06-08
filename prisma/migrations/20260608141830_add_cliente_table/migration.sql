-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tipoCliente" TEXT NOT NULL,
    "nomeRazao" TEXT NOT NULL,
    "nomeFantasiaDocumento" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "cnaePrincipal" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");
