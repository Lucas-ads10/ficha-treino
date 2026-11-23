-- AlterTable
ALTER TABLE `treinos_realizados` ADD COLUMN `aluno_id` INTEGER NULL,
    ADD COLUMN `ficha_exercicio_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `senha_hash` VARCHAR(255) NULL,
    `perfil` ENUM('ADMIN', 'ALUNO') NOT NULL,
    `status` ENUM('ATIVO', 'PENDENTE', 'BLOQUEADO') NOT NULL DEFAULT 'PENDENTE',
    `deve_trocar_senha` BOOLEAN NOT NULL DEFAULT false,
    `tentativas_falhas` INTEGER NOT NULL DEFAULT 0,
    `bloqueado_ate` DATETIME(3) NULL,
    `ultimo_acesso_em` DATETIME(3) NULL,
    `excluido_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `csrf_token` CHAR(64) NOT NULL,
    `criada_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimo_uso_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expira_em` DATETIME(3) NOT NULL,
    `revogada_em` DATETIME(3) NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip` VARCHAR(64) NULL,

    UNIQUE INDEX `sessoes_token_hash_key`(`token_hash`),
    INDEX `sessoes_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_acesso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `tipo` ENUM('CONVITE', 'RECUPERACAO') NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `usado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tokens_acesso_token_hash_key`(`token_hash`),
    INDEX `tokens_acesso_usuario_id_tipo_idx`(`usuario_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `peso` DECIMAL(5, 2) NOT NULL,
    `idade` INTEGER NOT NULL,
    `objetivo` VARCHAR(60) NOT NULL,
    `observacoes` TEXT NULL,
    `mensalidade` DECIMAL(10, 2) NOT NULL,
    `data_primeiro_pagamento` DATE NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `alunos_usuario_id_key`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aluno_id` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `data_pagamento` DATE NOT NULL,
    `forma` VARCHAR(40) NULL,
    `registrado_por_id` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagamentos_aluno_id_data_pagamento_idx`(`aluno_id`, `data_pagamento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fichas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aluno_id` INTEGER NOT NULL,
    `nome` VARCHAR(120) NOT NULL DEFAULT 'Ficha de treino',
    `ativa` BOOLEAN NULL,
    `iniciada_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `encerrada_em` DATETIME(3) NULL,

    INDEX `fichas_aluno_id_idx`(`aluno_id`),
    UNIQUE INDEX `fichas_aluno_id_ativa_key`(`aluno_id`, `ativa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ficha_divisoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ficha_id` INTEGER NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `excluido_em` DATETIME(3) NULL,

    INDEX `ficha_divisoes_ficha_id_idx`(`ficha_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ficha_exercicios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `divisao_id` INTEGER NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `tipo` ENUM('NORMAL', 'TEMPO', 'CARDIO') NOT NULL DEFAULT 'NORMAL',
    `series` INTEGER NOT NULL,
    `repeticoes` VARCHAR(160) NOT NULL,
    `carga_sugerida` DECIMAL(10, 2) NULL,
    `descanso_seg` INTEGER NULL,
    `observacoes` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `excluido_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `ficha_exercicios_divisao_id_idx`(`divisao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `treinos_realizados_aluno_id_exercicio_data_treino_idx` ON `treinos_realizados`(`aluno_id`, `exercicio`, `data_treino`);

-- CreateIndex
CREATE INDEX `treinos_realizados_ficha_exercicio_id_idx` ON `treinos_realizados`(`ficha_exercicio_id`);

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens_acesso` ADD CONSTRAINT `tokens_acesso_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alunos` ADD CONSTRAINT `alunos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fichas` ADD CONSTRAINT `fichas_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ficha_divisoes` ADD CONSTRAINT `ficha_divisoes_ficha_id_fkey` FOREIGN KEY (`ficha_id`) REFERENCES `fichas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ficha_exercicios` ADD CONSTRAINT `ficha_exercicios_divisao_id_fkey` FOREIGN KEY (`divisao_id`) REFERENCES `ficha_divisoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treinos_realizados` ADD CONSTRAINT `treinos_realizados_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treinos_realizados` ADD CONSTRAINT `treinos_realizados_ficha_exercicio_id_fkey` FOREIGN KEY (`ficha_exercicio_id`) REFERENCES `ficha_exercicios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
