/**
 * location.js - Bangladesh Location Selector (Vanilla JS)
 * Optimized for eCommerce Checkout
 */

(function () {
    "use strict";

    if (window.BDLocationSelector) return;

    const bdData = {
        "Barishal": {
            "Barguna": ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"],
            "Barishal": ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Barishal Sadar", "Mehendiganj", "Muladi", "Wazirpur"],
            "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
            "Jhalokati": ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
            "Patuakhali": ["Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali", "Dumki"],
            "Pirojpur": ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Pirojpur Sadar", "Nesarabad (Swarupkati)", "Indurkani"]
        },
        "Chattogram": {
            "Bandarban": ["Ali Kadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
            "Brahmanbaria": ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail", "Ashuganj", "Bijoynagar"],
            "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
            "Chattogram": ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda", "Karnaphuli"],
            "Cumilla": ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Cumilla Sadar", "Meghna", "Titas", "Monohargonj", "Cumilla Sadar Dakshin"],
            "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhia", "Pekua"],
            "Feni": ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Parshuram", "Sonagazi", "Fulgazi"],
            "Khagrachhari": ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
            "Lakshmipur": ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"],
            "Noakhali": ["Begumganj", "Noakhali Sadar", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Kabirhat"],
            "Rangamati": ["Bagaichhari", "Barkal", "Kawkhali", "Belaichhari", "Kaptai", "Jurachhari", "Langadu", "Naniarchar", "Rajasthali", "Rangamati Sadar"]
        },
        "Dhaka": {
            "Dhaka": ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar", "Tejgaon Circle"],
            "Faridpur": ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madukhali", "Nagarkanda", "Sadarpur", "Saltha"],
            "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
            "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
            "Kishoreganj": ["Itna", "Mithamain", "Nikli", "Astagram", "Bajitpur", "Bhairab", "Hossainpur", "Karimgonj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Pakundia", "Tarail"],
            "Madaripur": ["Rajoir", "Madaripur Sadar", "Kalkini", "Shibchar"],
            "Manikganj": ["Daulatpur", "Ghiror", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"],
            "Munshiganj": ["Gajaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
            "Narayanganj": ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
            "Narsingdi": ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
            "Rajbari": ["Baliakandi", "Goalandaghat", "Pangsha", "Rajbari Sadar", "Kalukhali"],
            "Shariatpur": ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"],
            "Tangail": ["Gopalpur", "Basail", "Bhuapur", "Delduar", "Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar", "Dhanbari"]
        },
        "Khulna": {
            "Bagerhat": ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
            "Chuadanga": ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"],
            "Jashore": ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Jashore Sadar", "Manirampur", "Sharsha"],
            "Jhenaidah": ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
            "Khulna": ["Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada"],
            "Kushtia": ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
            "Magura": ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
            "Meherpur": ["Gangni", "Meherpur Sadar", "Mujibnagar"],
            "Narail": ["Kalia", "Lohagara", "Narail Sadar"],
            "Satkhira": ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"]
        },
        "Mymensingh": {
            "Jamalpur": ["Baksiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"],
            "Mymensingh": ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Mymensingh Sadar", "Muktagachha", "Nandail", "Phulpur", "Trishal", "Tara Khanda"],
            "Netrokona": ["Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"],
            "Sherpur": ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"]
        },
        "Rajshahi": {
            "Bogra": ["Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"],
            "Joypurhat": ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"],
            "Naogaon": ["Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadevpur", "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
            "Natore": ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar", "Singra", "Naldanga"],
            "Chapainawabganj": ["Bholahat", "Gomastapur", "Nachole", "Chapainawabganj Sadar", "Shibganj"],
            "Pabna": ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"],
            "Rajshahi": ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"],
            "Sirajganj": ["Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullahpara"]
        },
        "Rangpur": {
            "Dinajpur": ["Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Dinajpur Sadar", "Nawabganj", "Parbatipur"],
            "Gaibandha": ["Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj", "Phulchhari"],
            "Kurigram": ["Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Kurigram Sadar", "Nageshwari", "Rariganj", "Roumari", "Ulipur"],
            "Lalmonirhat": ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"],
            "Nilphamari": ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"],
            "Panchagarh": ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
            "Rangpur": ["Badarganj", "Gangachara", "Kaunia", "Rangpur Sadar", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
            "Thakurgaon": ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"]
        },
        "Sylhet": {
            "Habiganj": ["Ajmiriganj", "Baniyachong", "Bahubal", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"],
            "Moulvibazar": ["Barlekha", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal", "Juri"],
            "Sunamganj": ["Bishwamvapur", "Chhatak", "Derai", "Dharamapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Sunamganj Sadar", "Tahirpur", "Dakshin Sunamganj"],
            "Sylhet": ["Balaganj", "Beanibazar", "Bishwanath", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Sylhet Sadar", "Zakiganj", "South Surma", "Osmani Nagar"]
        }
    };

    const injectStyles = () => {
        if (document.getElementById('bd-loc-style')) return;
        const s = document.createElement('style');
        s.id = 'bd-loc-style';
        s.innerHTML = `
            .bd-loc-field { position: relative; margin-bottom: 12px; }
            .bd-loc-input { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; background: #fff; }
            .bd-loc-input:focus { border-color: #2563eb; }
            .bd-loc-input:disabled { background: #f1f5f9; cursor: not-allowed; }
            .bd-loc-list { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; max-height: 200px; overflow-y: auto; z-index: 1000; display: none; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .bd-loc-list.active { display: block; }
            .bd-loc-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .bd-loc-item:hover { background: #eff6ff; color: #2563eb; }
            .bd-loc-item.selected { background: #2563eb; color: #fff; }
        `;
        document.head.appendChild(s);
    };

    class BDLocationSelector {
        constructor(id) {
            this.container = document.getElementById(id);
            if (!this.container) return;
            this.state = { division: "", district: "", upazila: "" };
            this.elements = {};
            this.init();
        }

        init() {
            injectStyles();
            this.render();
            this.attachEvents();
            this.loadCache();
        }

        render() {
            this.container.innerHTML = `
                <div class="bd-loc-field">${this.fieldHTML('division', 'Division')}</div>
                <div class="bd-loc-field">${this.fieldHTML('district', 'District')}</div>
                <div class="bd-loc-field">${this.fieldHTML('upazila', 'Upazila / Thana')}</div>
            `;
            ['division', 'district', 'upazila'].forEach(k => {
                this.elements[k] = {
                    in: this.container.querySelector(`#bd-in-${k}`),
                    ls: this.container.querySelector(`#bd-ls-${k}`)
                };
            });
        }

        fieldHTML(id, label) {
            return `<input type="text" class="bd-loc-input" id="bd-in-${id}" placeholder="Select ${label}" autocomplete="off">
                    <div class="bd-loc-list" id="bd-ls-${id}"></div>`;
        }

        attachEvents() {
            ['division', 'district', 'upazila'].forEach(k => {
                const { in: input } = this.elements[k];
                input.addEventListener('focus', () => { this.closeAll(); this.populate(k); this.elements[k].ls.classList.add('active'); });
                input.addEventListener('input', (e) => this.populate(k, e.target.value));
            });
            document.addEventListener('click', (e) => { if (!this.container.contains(e.target)) this.closeAll(); });
        }

        populate(k, filter = "") {
            const list = this.elements[k].ls;
            list.innerHTML = "";
            let opts = [];
            if (k === 'division') opts = Object.keys(bdData);
            else if (k === 'district' && this.state.division) opts = Object.keys(bdData[this.state.division]);
            else if (k === 'upazila' && this.state.district) opts = bdData[this.state.division][this.state.district];

            const filtered = opts.filter(o => o.toLowerCase().includes(filter.toLowerCase()));
            filtered.forEach(o => {
                const div = document.createElement('div');
                div.className = `bd-loc-item ${this.state[k] === o ? 'selected' : ''}`;
                div.innerText = o;
                div.onclick = () => this.select(k, o);
                list.appendChild(div);
            });
            if (filtered.length === 0) list.innerHTML = '<div class="bd-loc-item">No results</div>';
        }

        select(k, v) {
            this.state[k] = v;
            this.elements[k].in.value = v;
            this.closeAll();
            if (k === 'division') { this.state.district = ""; this.state.upazila = ""; this.elements.district.in.value = ""; this.elements.upazila.in.value = ""; }
            else if (k === 'district') { this.state.upazila = ""; this.elements.upazila.in.value = ""; }
            this.updateUI();
            this.saveCache();
            window.dispatchEvent(new CustomEvent('locationChanged', { detail: this.state }));
        }

        updateUI() {
            this.elements.district.in.disabled = !this.state.division;
            this.elements.upazila.in.disabled = !this.state.district;
        }

        closeAll() { this.container.querySelectorAll('.bd-loc-list').forEach(l => l.classList.remove('active')); }

        getSelectedLocation() { return this.state; }

        saveCache() { localStorage.setItem('bd_loc_cache', JSON.stringify(this.state)); }

        loadCache() {
            const c = localStorage.getItem('bd_loc_cache');
            if (c) {
                const d = JSON.parse(c);
                if (d.division) {
                    this.state.division = d.division; this.elements.division.in.value = d.division;
                    if (d.district) {
                        this.state.district = d.district; this.elements.district.in.value = d.district;
                        if (d.upazila) { this.state.upazila = d.upazila; this.elements.upazila.in.value = d.upazila; }
                    }
                }
            }
            this.updateUI();
            window.dispatchEvent(new CustomEvent('locationChanged', { detail: this.state }));
        }
    }

    window.BDLocationSelector = BDLocationSelector;
document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("location-selector");

    if (box) {
        window.bdLocation = new BDLocationSelector("location-selector");
    }
});
})();
