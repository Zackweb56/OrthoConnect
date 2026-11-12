CREATE TABLE `clinic_users` (
    `clinic_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'clinic_admin',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `clinic_users_user_id_idx`(`user_id`),
    PRIMARY KEY (`clinic_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `clinic_users`
    ADD CONSTRAINT `clinic_users_clinic_id_fkey`
    FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clinic_users`
    ADD CONSTRAINT `clinic_users_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payments`
    MODIFY COLUMN `method` VARCHAR(191) NULL,
    MODIFY COLUMN `notes` TEXT NULL;
