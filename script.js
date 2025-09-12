window.addEventListener('load', function() {
    const iframe = document.getElementById('map-iframe');
    const fallback = document.getElementById('map-fallback');
    let loaded = false;

    iframe.onload = () => {
        loaded = true;
    };

    iframe.addEventListener('error', function() {
        iframe.style.display = 'none';
        fallback.style.display = 'block';
    });

    setTimeout(function() {
        if (!loaded) {
            try {
                if (!iframe.contentWindow || !iframe.contentWindow.document || iframe.contentWindow.document.URL === 'about:blank') {
                     throw new Error('Iframe content is not accessible.');
                }
            } catch (e) {
                iframe.style.display = 'none';
                fallback.style.display = 'block';
            }
        }
    }, 5000); // 5 seconds timeout
});

document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.querySelector('.dropdown');
    const dropbtn = document.querySelector('.dropbtn');
    const dropdownContent = document.querySelector('.dropdown-content');

    dropbtn.addEventListener('click', function (event) {
        event.preventDefault();
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', function (event) {
        if (!dropdown.contains(event.target)) {
            dropdownContent.style.display = 'none';
        }
    });

    // Mobile warning
    const mobileWarning = document.getElementById('mobile-warning');
    const closeBtn = document.querySelector('.close-btn');

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        mobileWarning.style.display = 'block';
    }

    closeBtn.addEventListener('click', function() {
        mobileWarning.style.display = 'none';
    });
});