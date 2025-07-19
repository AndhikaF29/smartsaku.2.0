// Mobile Menu Toggle
      document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
      });

      // Close sidebar when overlay is clicked
      document.getElementById('sidebarOverlay').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });

      // Close sidebar when link is clicked (mobile)
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
          if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
          }
        });
      });