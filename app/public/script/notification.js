document.addEventListener("DOMContentLoaded", function () {
  // Récupérer les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);

  // Paramètre à vérifier (message)
  const messageParam = urlParams.get("message");

  // Si le paramètre message existe
  if (messageParam) {
    // Récupérer l'élément de notification et son contenu
    const notif = document.querySelector(".notif");
    const notifContent = document.getElementById("notif-content");

    if (notif && notifContent) {
      // Définir le contenu du message
      notifContent.textContent = decodeURIComponent(messageParam);

      // Make the notification content visible
      notifContent.style.display = "block";

      // Afficher la notification
      notif.style.display = "block";
      setTimeout(() => {
        notif.classList.add("show");
      }, 100);

      // Faire disparaître la notification après 5 secondes
      setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => {
          notif.style.display = "none";
        }, 300);
      }, 5000);

      // Nettoyer l'URL en supprimant le paramètre message
      if (window.history && window.history.replaceState) {
        // Créez une nouvelle URL sans le paramètre message
        let cleanUrl = window.location.href.split("?")[0];

        // Conserver les autres paramètres
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("message");

        if (newParams.toString()) {
          cleanUrl += "?" + newParams.toString();
        }

        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }
});
