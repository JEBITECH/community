import { AddonFeeType } from './enums/Addonfee-type.enum';
import { ValueType } from './enums/value-type.enum';

export class ReservationAddons {
  pms_name?: string;
  product_name?: string;
  product_id?: number;
  pms_id?: string;
  value?: number;
  per_day_price?: number;
  product_category?: string;
  owner_value?: number;
  pms_value?: number;
  value_type?: ValueType;
  fee_type?: AddonFeeType;
  fee_per_day?: number;
}