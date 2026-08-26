const membersSlider = new Swiper(".slide-content", {
    slidesPerView: 5,
    spaceBetween: 25,
    grabCursor: true,
    centeredSlides: true,
    // fade: true,
    loop: true,
    slideActiveClass: "swiper-slide-active",
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },

    breakpoints: {
        0: {
            slidesPerView: 1,
        },
        520: {
            slidesPerView: 3,
        },

        992: {
            slidesPerView: 5,
        },
    },
});

// select all sub-teams in the page
const subTeams = document.querySelectorAll(".sub-team");

// select all buttons in the page that have team-button class
const buttons = document.querySelectorAll(".team-button");

// add event listener to all buttons where click on it call function show
buttons.forEach((button) => button.addEventListener("click", show));

function show() {
    const subTeamId = this.id;
    subTeams.forEach((subTeam) => {
        subTeam.id !== subTeamId
            ? subTeam.classList.add("hide")
            : subTeam.classList.remove("hide");
    });

    // document.querySelector(`#${sectionId}`).classList.add('show');
}


// this is for the subteam buttons
  // carousel.js

document.addEventListener('DOMContentLoaded', function () {
  if (!swipableContainer) return;
  var swipableContainer = document.querySelector('.swipable-buttons');
  var startX;
  var scrollLeft;

  swipableContainer.addEventListener('touchstart', function (e) {
    startX = e.touches[0].pageX;
    scrollLeft = swipableContainer.scrollLeft;
  });

  swipableContainer.addEventListener('touchmove', function (e) {
    if (!startX) return;
    var x = e.touches[0].pageX - startX;
    swipableContainer.scrollLeft = scrollLeft - x;
  });

  swipableContainer.addEventListener('touchend', function () {
    startX = null;
  });

  var scrollDistance = 150; // Adjust scroll distance
  var intervalDuration = 1000; // Adjust interval duration (in milliseconds)

  function autoSwipe() {
    // Use the Scroll API for smooth scrolling
    swipableContainer.scrollBy({
      left: scrollDistance,
      behavior: 'smooth'
    });

    // Reset scroll position to the beginning if at the end
    if (swipableContainer.scrollLeft + swipableContainer.clientWidth >= swipableContainer.scrollWidth) {
      swipableContainer.scrollLeft = 0;
    }
  }

  // Start auto-swiping in both directions at regular intervals
  var swipeInterval = setInterval(autoSwipe, intervalDuration);

  // Stop auto-swiping and clear interval when the container is clicked
  swipableContainer.addEventListener('click', function () {
    clearInterval(swipeInterval);
  });

  // Enable swiping in both directions until the user gives input
  swipableContainer.addEventListener('touchstart', function () {
    clearInterval(swipeInterval);
  });

  // Manual scroll function
  function manualScroll(direction) {
    swipableContainer.scrollBy({
      left: direction * scrollDistance,
      behavior: 'smooth'
    });

    // Reset scroll position to the beginning if at the end
    if (swipableContainer.scrollLeft + swipableContainer.clientWidth >= swipableContainer.scrollWidth) {
      swipableContainer.scrollLeft = 0;
    }
  }

  // Expose manualScroll function to the global scope for onclick attribute in HTML
  window.manualScroll = manualScroll;
});
