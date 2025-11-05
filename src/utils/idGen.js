import { v4 as uuidv4 } from 'uuid';

export function generateId(prefix = 'job') {
  return `${prefix}_${uuidv4()}`;
}

export default { generateId };
