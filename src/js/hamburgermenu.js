// Mobile Menu Toggle
      document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const menuBtn = document.getElementById('mobileMenuBtn');

        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        // Hide hamburger when sidebar is open
        if (sidebar.classList.contains('active')) {
          menuBtn.style.display = 'none';
        } else {
          menuBtn.style.display = '';
        }
      });

      // Close sidebar when overlay is clicked
      document.getElementById('sidebarOverlay').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const menuBtn = document.getElementById('mobileMenuBtn');

        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        // Show hamburger again
        menuBtn.style.display = '';
      });

      // Close sidebar when link is clicked (mobile)
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
          if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const menuBtn = document.getElementById('mobileMenuBtn');

            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            // Show hamburger again
            menuBtn.style.display = '';
          }
        });
      });