
-- CreateTable
CREATE TABLE `treinos_realizados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `treino` VARCHAR(100) NOT NULL,
    `exercicio` VARCHAR(150) NOT NULL,
    `serie` INTEGER NOT NULL,
    `carga` DECIMAL(10, 2) NULL,
    `repeticoes` INTEGER NULL,
    `valor_tempo` DECIMAL(10, 2) NULL,
    `data_treino` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

