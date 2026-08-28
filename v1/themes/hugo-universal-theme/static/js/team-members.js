// -- Outer directors carousel --------------------------------
const directorsSwiper = new Swiper("#directors-swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: false,
    rewind: true,
    autoHeight: true,
    navigation: {
        nextEl: ".directors-next",
        prevEl: ".directors-prev",
    },
    on: {
        slideChange: function () {
            closeDetail();
        }
    }
});

// -- Inner sub-team carousels (one per director slide) -------
document.querySelectorAll(".subteams-inner-swiper").forEach((el) => {
    const container = el.closest(".director-slide") || el.parentElement;
    new Swiper(el, {
        slidesPerView: "auto",
        spaceBetween: 20,
        loop: false,
        rewind: true,
        grabCursor: true,
        navigation: {
            nextEl: el.querySelector(".subteam-next"),
            prevEl: el.querySelector(".subteam-prev"),
        },
        breakpoints: {
            0:   { slidesPerView: 2 },
            520: { slidesPerView: 3 },
            992: { slidesPerView: 4 },
        },
    });
});

// -- Sub-team card click: show detail panel below ------------
document.querySelectorAll(".subteam-card").forEach((card) => {
    card.addEventListener("click", function () {
        const teamId = this.dataset.teamId;
        const detailPanel = document.getElementById("subteam-detail");
        const detailInner = detailPanel.querySelector(".subteam-detail-inner");

        // Find the matching data block
        const dataBlock = document.querySelector(`.subteam-data [data-team-id="${teamId}"]`);
        if (!dataBlock) return;

        // If same card clicked again, toggle close
        if (!detailPanel.classList.contains("hide") &&
            detailPanel.dataset.activeTeam === teamId) {
            closeDetail();
            return;
        }

        // Mark active card
        document.querySelectorAll(".subteam-card").forEach(c => c.classList.remove("active"));
        this.classList.add("active");

        // Fill and show detail panel
        detailInner.innerHTML = dataBlock.innerHTML;
        detailPanel.dataset.activeTeam = teamId;
        detailPanel.classList.remove("hide");

        // Smooth scroll to detail panel
        detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

function closeDetail() {
    const detailPanel = document.getElementById("subteam-detail");
    detailPanel.classList.add("hide");
    detailPanel.dataset.activeTeam = "";
    document.querySelectorAll(".subteam-card").forEach(c => c.classList.remove("active"));
}