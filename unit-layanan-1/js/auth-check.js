(function() {
    // Cek apakah sudah memasukkan password di session ini
    if (sessionStorage.getItem('hazana_beta_auth') !== 'true') {
        let pass = prompt("Masukkan Password Akses (Preview):");
        if (pass === "betafoz2026") {
            sessionStorage.setItem('hazana_beta_auth', 'true');
        } else {
            alert("Password salah!");
            document.write("<h2 style='text-align:center;font-family:sans-serif;margin-top:20%;'>Akses Ditolak. Password Salah.</h2>");
            window.stop(); // Stop loading HTML
        }
    }
})();
