import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IsNumber, IsObject } from "class-validator";
import { Roles } from "./roles.model";
import { Action } from "./action.model";
import { SubAction } from "./subaction.model";
import { ModuleEntity, Organization } from "@shared/entities";

@Entity('role_module_access')
export class RoleModuleAccess {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
    @IsObject()
    organization: Organization;

    @Column({ nullable: true })
    @IsNumber()
    organization_id?: number;

    @ManyToOne(() => Roles)
    @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
    @IsObject()
    role: Roles;

    @Column({ nullable: true })
    @IsNumber()
    role_id?: number;

    @ManyToOne(() => ModuleEntity)
    @JoinColumn({ name: 'module_id', referencedColumnName: 'id' })
    @IsObject()
    module: ModuleEntity;

    @Column({ nullable: true })
    @IsNumber()
    module_id?: number;

    @ManyToOne(() => Action)
    @JoinColumn({ name: 'action_id', referencedColumnName: 'id' })
    @IsObject()
    action: Action;

    @Column({ nullable: true })
    @IsNumber()
    action_id?: number;

    @ManyToOne(() => SubAction)
    @JoinColumn({ name: 'sub_action_id', referencedColumnName: 'id' })
    @IsObject()
    sub_action: SubAction;

    @Column({ nullable: true })
    @IsNumber()
    sub_action_id?: number;

    @Column({ nullable: true, default: true })
    @IsNumber()
    is_access?: boolean;

}
