package com.pfe.medical.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service d'envoi d'emails (OTP, notifications).
 * L'envoi est asynchrone pour ne pas bloquer la requête HTTP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Envoie un email de vérification OTP à l'adresse donnée.
     * Méthode asynchrone — ne bloque pas l'appelant.
     *
     * @param toEmail  Email du destinataire
     * @param prenom   Prénom de l'assuré (pour personnaliser le message)
     * @param otpCode  Code OTP à 6 chiffres
     */
    @Async
    public void sendOtpEmail(String toEmail, String prenom, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "MedRemboursement - Assurance Médicale");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Votre code de vérification — MedRemboursement");
            helper.setText(buildHtmlEmail(prenom, otpCode), true);

            mailSender.send(message);
            log.info("Email OTP envoyé à : {}", toEmail);

        } catch (MessagingException e) {
            log.error("Échec envoi email OTP à {} : {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'envoi email OTP : {}", e.getMessage());
        }
    }

    /**
     * Construit le template HTML de l'email OTP.
     */
    private String buildHtmlEmail(String prenom, String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f8;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="520" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:16px;overflow:hidden;
                                  box-shadow:0 4px 24px rgba(0,0,0,0.10);">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#0F172A 0%%,#1E3A5F 100%%);
                                   padding:36px 40px;text-align:center;">
                          <div style="font-size:32px;margin-bottom:8px;">🏥</div>
                          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                                     letter-spacing:0.5px;">MedRemboursement</h1>
                          <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">
                            Assurance Médicale Intelligente
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:40px 40px 32px;">
                          <h2 style="margin:0 0 12px;color:#0F172A;font-size:20px;font-weight:600;">
                            Bonjour %s 👋
                          </h2>
                          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                            Merci de créer votre compte sur <strong>MedRemboursement</strong>.
                            Pour finaliser votre inscription, veuillez entrer le code de vérification
                            ci-dessous dans l'application :
                          </p>

                          <!-- OTP Box -->
                          <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);
                                      border:2px solid #3B82F6;border-radius:12px;
                                      padding:28px;text-align:center;margin:0 0 24px;">
                            <p style="margin:0 0 8px;color:#1E40AF;font-size:12px;
                                      font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
                              Code de vérification
                            </p>
                            <div style="font-size:42px;font-weight:800;color:#1E3A8A;
                                        letter-spacing:12px;margin:4px 0;">
                              %s
                            </div>
                            <p style="margin:12px 0 0;color:#3B82F6;font-size:12px;">
                              ⏱ Ce code expire dans <strong>10 minutes</strong>
                            </p>
                          </div>

                          <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">
                            Si vous n'avez pas demandé la création de compte, ignorez cet email.
                          </p>
                          <p style="margin:0;color:#64748B;font-size:13px;line-height:1.6;">
                            ⚠️ Ne partagez jamais ce code avec quelqu'un.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;
                                   padding:20px 40px;text-align:center;">
                          <p style="margin:0;color:#94A3B8;font-size:12px;">
                            © 2025 MedRemboursement · Assurance Médicale
                          </p>
                          <p style="margin:4px 0 0;color:#CBD5E1;font-size:11px;">
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(prenom, otpCode);
    }

    /**
     * Envoie un email avec le mot de passe temporaire pour les comptes créés par l'admin.
     */
    @Async
    public void sendAdminCreationEmail(String toEmail, String prenom, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "MedRemboursement - Assurance Médicale");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Création de votre compte — MedRemboursement");
            helper.setText(buildAdminHtmlEmail(prenom, tempPassword), true);

            mailSender.send(message);
            log.info("Email de création admin envoyé à : {}", toEmail);

        } catch (MessagingException e) {
            log.error("Échec envoi email admin à {} : {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'envoi email admin : {}", e.getMessage());
        }
    }

    private String buildAdminHtmlEmail(String prenom, String tempPassword) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f8;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="520" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:16px;overflow:hidden;
                                  box-shadow:0 4px 24px rgba(0,0,0,0.10);">
                      <tr>
                        <td style="background:linear-gradient(135deg,#0F172A 0%%,#1E3A5F 100%%);
                                   padding:36px 40px;text-align:center;">
                          <div style="font-size:32px;margin-bottom:8px;">🏥</div>
                          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">MedRemboursement</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:40px 40px 32px;">
                          <h2 style="margin:0 0 12px;color:#0F172A;font-size:20px;font-weight:600;">
                            Bonjour %s 👋
                          </h2>
                          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                            Votre compte a été créé par l'administrateur. Voici votre mot de passe temporaire :
                          </p>
                          <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);
                                      border:2px solid #3B82F6;border-radius:12px;
                                      padding:28px;text-align:center;margin:0 0 24px;">
                            <div style="font-size:32px;font-weight:800;color:#1E3A8A;
                                        letter-spacing:4px;margin:4px 0;">
                              %s
                            </div>
                          </div>
                          <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">
                            Lors de votre première connexion, il vous sera demandé de modifier ce mot de passe.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(prenom, tempPassword);
    }
}
