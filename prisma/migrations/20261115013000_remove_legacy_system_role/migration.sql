UPDATE `clinic_users`
SET `role` = ''
WHERE `role` = 'responsable';

DELETE `role_permissions`
FROM `role_permissions`
INNER JOIN `roles` ON `roles`.`id` = `role_permissions`.`role_id`
WHERE `roles`.`name` = 'responsable';

DELETE FROM `roles`
WHERE `name` = 'responsable';
