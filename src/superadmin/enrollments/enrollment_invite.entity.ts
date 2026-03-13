import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("enrollment_invites")
export class EnrollmentInvite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  client_name: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar", nullable: true })
  whatsapp?: string;

  @Column({ type: "int", nullable: true })
  plan_id?: number;

  @Column({ type: "varchar" })
  token: string;

  @Column({ type: "boolean", default: false })
  completed: boolean;

  @CreateDateColumn()
  created_at: Date;
}
