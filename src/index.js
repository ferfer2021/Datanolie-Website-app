function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url);


    // Contact form submit
    if (
      request.method === "POST" &&
      url.pathname === "/contactus/send"
    ) {

      const form = await request.formData();

      const name =
        form.get("name") || "";

      const email =
        form.get("email") || "";

      const description =
        form.get("description") || "";


      if (!env.RESEND_API_KEY) {

        return Response.redirect(
          new URL(
            "/contactus/index.html?mail_status=failed",
            request.url
          ),
          302
        );

      }


      const html = `
      <h2>New Contact Request</h2>

      <strong>Name:</strong>
      ${escapeHtml(name)}

      <br>

      <strong>Email:</strong>
      ${escapeHtml(email)}

      <br>

      <strong>Description:</strong>
      ${escapeHtml(description)}
      `;


      const response = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${env.RESEND_API_KEY}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            from:
              "onboarding@resend.dev",

            to: [
              "ferres@datanolie.com.au"
            ],

            subject:
              "New Contact Form Submission - DataNoLie",

            html

          })
        }
      );


      if (!response.ok) {

        return Response.redirect(
          new URL(
            "/contactus/index.html?mail_status=failed",
            request.url
          ),
          302
        );

      }


      return Response.redirect(
        new URL(
          "/contactus/index.html?mail_status=sent",
          request.url
        ),
        302
      );
    }


    // Static files
    return env.ASSETS.fetch(request);

  }
};