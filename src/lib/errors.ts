const AUTH_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Credenciales inválidas.',
  'Email not confirmed': 'Correo electrónico no confirmado. Revisa tu bandeja de entrada.',
  'User already registered': 'Este correo ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Password should be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres.',
  'Token has expired or is invalid': 'El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.',
  'For security purposes, you can only request this once every 60 seconds': 'Por seguridad, debes esperar un minuto antes de volver a solicitarlo.',
  'rate_limit': 'Demasiados intentos. Intenta de nuevo más tarde.',
};

const DB_CODES: Record<string, string> = {
  '23505': 'Este registro ya existe.',
  '23503': 'No se puede eliminar: está siendo usado en otra operación.',
  '42501': 'No tienes permisos para realizar esta acción.',
  '42P01': 'Error interno del sistema.',
  'PGRST116': 'El recurso solicitado no existe.',
};

export function sanitizeError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Error desconocido.';

  const err = error as Record<string, unknown>;

  if (typeof err.code === 'string' && DB_CODES[err.code]) {
    return DB_CODES[err.code];
  }

  if (typeof err.message === 'string') {
    if (AUTH_MESSAGES[err.message]) return AUTH_MESSAGES[err.message];
  }

  return 'Ocurrió un error. Intenta de nuevo.';
}
