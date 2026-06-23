import { X, Shield, FileText, LifeBuoy } from 'lucide-react';

export type LegalModalType = 'privacy' | 'terms' | 'support' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
}

export const LegalModals = ({ activeModal, onClose }: LegalModalsProps) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative flex flex-col bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            {activeModal === 'privacy' && <Shield className="h-5 w-5 text-primary" />}
            {activeModal === 'terms' && <FileText className="h-5 w-5 text-primary" />}
            {activeModal === 'support' && <LifeBuoy className="h-5 w-5 text-primary" />}
            <h2 className="text-lg font-bold">
              {activeModal === 'privacy' && 'Políticas de Privacidad'}
              {activeModal === 'terms' && 'Términos de Servicio'}
              {activeModal === 'support' && 'Soporte Técnico'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-sm text-muted-foreground space-y-4">
          {activeModal === 'privacy' && (
            <>
              <p className="font-medium text-foreground">Última actualización: Junio de 2026</p>
              <p>En <strong>Current ERP</strong> ("nosotros", "nuestro"), respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestra aplicación web.</p>
              
              <h3 className="text-foreground font-semibold mt-6">1. Recopilación de Información</h3>
              <p>Recopilamos información personal que nos proporcionas voluntariamente al registrarte, expresando interés en obtener información sobre nosotros o nuestros productos, o al utilizar nuestros servicios. La información personal puede incluir: nombre, dirección de correo electrónico, números de contacto, e información comercial vinculada a tu almacén.</p>

              <h3 className="text-foreground font-semibold mt-6">2. Uso de tu Información</h3>
              <p>El uso de tus datos está estrictamente limitado a proporcionarte los servicios de Current. Esto incluye la gestión de sesiones, la administración de inventarios, roles de equipo y métricas de dashboard. No vendemos ni alquilamos tu información personal a terceros bajo ninguna circunstancia.</p>

              <h3 className="text-foreground font-semibold mt-6">3. Seguridad de Datos</h3>
              <p>Implementamos medidas de seguridad técnicas y organizativas de grado empresarial para proteger tus datos personales. Todas las transacciones y la información sensible se transmiten a través de tecnología Secure Socket Layer (SSL) y se encriptan en nuestras bases de datos con los estándares más rigurosos del mercado.</p>

              <h3 className="text-foreground font-semibold mt-6">4. Tus Derechos</h3>
              <p>Tienes el derecho de acceder, rectificar o eliminar tu información personal almacenada en nuestros servidores. Si deseas ejercer estos derechos, comunícate con nuestro equipo de soporte.</p>
            </>
          )}

          {activeModal === 'terms' && (
            <>
              <p className="font-medium text-foreground">Última actualización: Junio de 2026</p>
              <p>Estos Términos de Servicio ("Términos") rigen tu acceso y uso de la plataforma <strong>Current ERP</strong>. Al acceder o utilizar nuestros servicios, aceptas estar sujeto a estos Términos.</p>

              <h3 className="text-foreground font-semibold mt-6">1. Uso de la Plataforma</h3>
              <p>Se te otorga una licencia no exclusiva, intransferible y revocable para acceder y utilizar Current ERP estrictamente de acuerdo con estos Términos. Como condición de tu uso, garantizas que no utilizarás la plataforma para ningún propósito ilegal o prohibido por estos Términos.</p>

              <h3 className="text-foreground font-semibold mt-6">2. Cuentas de Usuario y Seguridad</h3>
              <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Aceptas la responsabilidad de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos de inmediato sobre cualquier brecha de seguridad o uso no autorizado.</p>

              <h3 className="text-foreground font-semibold mt-6">3. Propiedad Intelectual</h3>
              <p>Todo el contenido incluido como parte del servicio, como texto, gráficos, logotipos, imágenes, así como la compilación de estos, y cualquier software utilizado, es propiedad de Current o de sus proveedores y está protegido por las leyes de derechos de autor y otras leyes de propiedad intelectual.</p>

              <h3 className="text-foreground font-semibold mt-6">4. Limitación de Responsabilidad</h3>
              <p>Current no será responsable de ningún daño indirecto, punitivo, incidental, especial, consecuente u otros daños que resulten del uso o la incapacidad de usar el servicio, incluidos, entre otros, la pérdida de datos o la interrupción del negocio.</p>
            </>
          )}

          {activeModal === 'support' && (
            <>
              <div className="flex flex-col items-center text-center py-6">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <LifeBuoy className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">¿Necesitas ayuda con Current?</h3>
                <p className="mt-2 text-muted-foreground max-w-md">Nuestro equipo de soporte está dedicado a garantizar que tu flujo de trabajo no sufra interrupciones. Estamos aquí para ti 24/7.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-xl p-5 bg-card hover:bg-muted/30 transition-colors">
                  <h4 className="font-bold text-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Centro de Ayuda</h4>
                  <p className="text-sm mt-2">Consulta nuestras guías detalladas, tutoriales y preguntas frecuentes para resolver dudas rápidas.</p>
                </div>
                <div className="border rounded-xl p-5 bg-card hover:bg-muted/30 transition-colors">
                  <h4 className="font-bold text-foreground flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Soporte en Vivo</h4>
                  <p className="text-sm mt-2">¿Un problema crítico? Contáctanos a través de nuestro chat de soporte o envíanos un correo directamente.</p>
                </div>
              </div>

              <div className="mt-8 bg-muted/50 p-4 rounded-lg text-center border">
                <p className="font-medium text-foreground">Contacto Directo</p>
                <a href="mailto:soporte@current.com" className="text-primary hover:underline font-semibold mt-1 inline-block">soporte@current.com</a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/10 shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
