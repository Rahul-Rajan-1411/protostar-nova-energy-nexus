
import bcrypt from 'bcryptjs';

/**
 * Verifies a password against a hash
 * @param password The plain text password to verify
 * @param hash The hash to check against
 * @returns True if the password matches the hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Hash a password using bcrypt
 * @param password The plain text password to hash
 * @returns The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};
