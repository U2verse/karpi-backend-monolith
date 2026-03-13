import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenant_storage')
export class TenantStorage {
  @PrimaryColumn('uuid')
  tenant_id: string;

  @Column('bigint', { default: 0 })
  storage_used_bytes: number;

  @UpdateDateColumn()
  last_updated: Date;
}
