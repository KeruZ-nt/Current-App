<div align="center">
  <img src="public/logo.svg" alt="Current Logo" width="120" height="120" />
  <h1>Current V1-b - Sistema Operativo de Almacenes</h1>
  <p><strong>Plataforma moderna y profesional de gestión de almacenes e inventario.</strong></p>
  <p><em>"Demostrando que somos una corriente en calma."</em></p>
</div>

---

## 🚀 Sobre Current

**Current** es un sistema inteligente diseñado para la gestión eficiente de múltiples almacenes, control de inventario en tiempo real, registro de transacciones (ventas y compras) y administración de colaboradores. 

Construido con un enfoque en **diseño premium (Clean Light Theme & Bento Grid)**, **alta usabilidad** y **seguridad de datos**, Current permite a las empresas tomar el control total de sus flujos de trabajo sin fricciones, fluyendo como una corriente en calma. Listo para despliegue en Vercel.

### ✨ Características Principales

- 🏢 **Soporte Multi-Almacén:** Administra diferentes tiendas o bodegas desde una sola cuenta.
- 📦 **Control de Inventario Avanzado:** Seguimiento de stock en tiempo real y alertas de stock mínimo (crítico).
- 💸 **Registro de Transacciones:** Historial inmutable de compras masivas, ventas y ajustes de stock.
- 👥 **Gestión de Equipo:** Sistema de roles (Admin/Colaborador) con códigos de invitación seguros.
- 📊 **Dashboard Ejecutivo:** Gráficos y métricas automáticas sobre ingresos, gastos y rentabilidad mensual en un moderno layout asimétrico.
- 🎨 **Diseño V1-b (Clean Light):** Interfaz prístina con tipografía dual (`Inter` y `Space Grotesk`), glassmorphism e inspiraciones en paneles técnicos avanzados.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS v4 + UI Custom Glassmorphism
- **Estado:** Zustand (Gestión global rápida y ligera)
- **Backend / BaaS:** Supabase (PostgreSQL, Autenticación, Row Level Security)
- **Gráficos:** Recharts
- **Enrutamiento:** React Router DOM v6
- **Despliegue:** Optimizado para Vercel (`vercel.json` incluido)

## 📦 Instalación y Desarrollo Local

1. Clona este repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno en un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🔒 Seguridad (Supabase RLS)

Current utiliza **Row Level Security (RLS)** a nivel de base de datos para garantizar el aislamiento total de los datos. Ningún usuario puede acceder a la información de un almacén (`workspace`) si no es miembro oficial del mismo. Consulta `ROADMAP.md` para ver el plan de implementaciones de seguridad futuras como MFA y Logs de Auditoría.

---
<div align="center">
  Hecho con excelencia para potenciar los negocios modernos. Versión: Current V1-b.
</div>

