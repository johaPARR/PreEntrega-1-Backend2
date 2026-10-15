import nodemailer from "nodemailer";

const createTransporter = () => {
  const port = Number(process.env.MAIL_PORT);
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

export const sendTicketConfirmation = async ({ to, event, ticket }) => {
  const transporter = createTransporter();

  const eventDate = new Date(event.date).toLocaleDateString("es-AR");

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Confirmación de inscripción: ${event.title}`,
    text: [
      "¡Tu inscripción fue confirmada!",
      "",
      `Evento: ${event.title}`,
      `Fecha: ${eventDate}`,
      `Lugar: ${event.location}`,
      `Cantidad de lugares: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
    ].join("\n"),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Confirmación enviada (preview Ethereal): ${previewUrl}`);
  }
};
export const sendTicketCancellation = async ({ to, event, ticket }) => {
  const transporter = createTransporter();

  const eventDate = new Date(event.date).toLocaleDateString("es-AR");

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Inscripción cancelada: ${event.title}`,
    text: [
      "Tu inscripción fue cancelada.",
      "",
      `Evento: ${event.title}`,
      `Fecha: ${eventDate}`,
      `Lugar: ${event.location}`,
      `Cantidad de lugares liberados: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
    ].join("\n"),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Cancelación enviada (preview Ethereal): ${previewUrl}`);
  }
};