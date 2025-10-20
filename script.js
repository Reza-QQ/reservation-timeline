  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function loadTables() {
    $.getJSON('settings.json?' + new Date().getTime(), function (settings) {
      const startTime = settings.start_time || '08:00';
      const endTime = settings.end_time || '23:59';
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const totalMinutes = endMinutes - startMinutes;
      const today = new Date().toISOString().split('T')[0];

      $.getJSON('table.json?' + new Date().getTime(), function (tables) {
        $.getJSON('reservations.json?' + new Date().getTime(), function (reservations) {
          $('#contentArea').empty();

          tables.forEach(function (table) {
            const tableDiv = $(`
              <div class="table-box" data-id="${table.id}">
                <div class="table-actions">
                  <button class="btn-reserve" data-id="${table.id}">رزرو ${table.name}</button>
                  <button class="btn-delete" data-id="${table.id}">حذف میز</button>
                </div>
                <div class="table-reservation" id="reservation-${table.id}">
                  <div class="reservation-track">
                    <div class="reservation-bar-container"></div>
                  </div>
                </div>
              </div>
            `);

            const tableReservations = reservations
              .filter(r => r.table_id === table.id && r.date === today)
              .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

            let lastEnd = startMinutes;

            tableReservations.forEach(function (res) {
              const resStart = timeToMinutes(res.start_time);
              const resEnd = timeToMinutes(res.end_time);

              // نوار آزاد قبل از رزرو
              if (resStart > lastEnd) {
                const freeStart = lastEnd;
                const freeEnd = resStart;
                const leftPercent = ((freeStart - startMinutes) / totalMinutes) * 100;
                const widthPercent = ((freeEnd - freeStart) / totalMinutes) * 100;

                const freeBar = $(`
                  <div class="reservation-bar free" style="right:${leftPercent}%; width:${widthPercent}%;">
                    <span>${minutesToTime(freeEnd)}</span>
                    <span>آزاد</span>
                    <span>${minutesToTime(freeStart)}</span>
                  </div>
                `);
                tableDiv.find('.reservation-bar-container').append(freeBar);
              }

              // نوار رزرو
              const leftPercent = ((resStart - startMinutes) / totalMinutes) * 100;
              const widthPercent = ((resEnd - resStart) / totalMinutes) * 100;

              const reservedBar = $(`
                <div class="reservation-bar reserved" style="right:${leftPercent}%; width:${widthPercent}%;">
                  <span>${res.end_time}</span>
                  <span>${res.customer}</span>
                  <span>${res.start_time}</span>
                </div>
              `);
              tableDiv.find('.reservation-bar-container').append(reservedBar);

              lastEnd = Math.max(lastEnd, resEnd);
            });

            // نوار آزاد بعد از آخرین رزرو
            if (lastEnd < endMinutes) {
              const freeStart = lastEnd;
              const freeEnd = endMinutes;
              const leftPercent = ((freeStart - startMinutes) / totalMinutes) * 100;
              const widthPercent = ((freeEnd - freeStart) / totalMinutes) * 100;

              const freeBar = $(`
                <div class="reservation-bar free" style="right:${leftPercent}%; width:${widthPercent}%;">
                  <span>${minutesToTime(freeEnd)}</span>
                  <span>آزاد</span>
                  <span>${minutesToTime(freeStart)}</span>
                </div>
              `);
              tableDiv.find('.reservation-bar-container').append(freeBar);
            }

            $('#contentArea').append(tableDiv);
          });
        });
      });
    });
  }


$(document).ready(function () {

  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const timeString = `${hours}:${minutes}`;
    $('#clock').text(timeString);
  }

  updateClock(); // نمایش اولیه
  setInterval(updateClock, 10000); // به‌روزرسانی هر دقیقه






  loadTables();






  // باز کردن مودال
  $('#settingsBtn').on('click', function () {
    $.getJSON('settings.json')
      .done(function (settings) {
        const appName = settings.app_name || 'برنامه من';
        const startTableTime = settings.start_time || '08:00';
        const endTableTime = settings.end_time || '23:59';

        $('#appNameInput').val(appName);
        $('#startTableTimeInput').val(startTableTime);
        $('#endTableTimeInput').val(endTableTime);
      })
      .fail(function () {
        // اگر فایل وجود نداشت یا خطا داشت، مقادیر پیش‌فرض
        $('#appNameInput').val('برنامه من');
        $('#startTableTimeInput').val('08:00');
        $('#endTableTimeInput').val('23:59');
      });

    $('#settingsModal').fadeIn(200);
  });

  // بستن مودال
  $('#closeSettingsBtn').on('click', function () {
    $('#settingsModal').fadeOut(200);
  });

  // بستن با کلیک بیرون از کادر
  $('#settingsModal').on('click', function (e) {
    if ($(e.target).is('#settingsModal')) {
      $('#settingsModal').fadeOut(200);
    }
  });

  // ذخیره تنظیمات
  $('#saveSettingsBtn').on('click', function () {
    const appName = $('#appNameInput').val().trim();
    const startTime = $('#startTableTimeInput').val();
    const endTime = $('#endTableTimeInput').val();

    if (!appName || !startTime || !endTime) return;

    const settingsData = {
      app_name: appName,
      start_time: startTime,
      end_time: endTime
    };

    $.ajax({
      url: 'save_settings.php',
      method: 'POST',
      data: JSON.stringify(settingsData),
      contentType: 'application/json',
      success: function () {
        $('#settingsModal').fadeOut(200);

        $('#successMessage').text('تنظیمات با موفقیت ذخیره شد.').fadeIn(300);

        setTimeout(function () {
          $('#successMessage').fadeOut(300);
        }, 3000);
        $.getJSON('settings.json?' + new Date().getTime(), function (settings) {
          if (settings.app_name) {
            $('.app-title').text(settings.app_name);
          }
          // اگر بخوای ساعت‌ها رو هم اعمال کنی، اینجا اضافه کن
        });
      },
      error: function () {
        $('#settingsModal').fadeOut(200);

        $('#errorMessage').text('خطا در ذخیره تنظیمات.').fadeIn(300);

        setTimeout(function () {
          $('#errorMessage').fadeOut(300);
        }, 3000);
      }
    });
  });

  // خواندن تنظیمات و اعمال نام برنامه
  $.getJSON('settings.json', function (settings) {
    if (settings.app_name) {
      $('.app-title').text(settings.app_name);
    }
  });









  // باز کردن مودال درج میز
  $('#insertTableBtn').on('click', function () {
    $('#tableNameInput').val('');
    $('#insertTableModal').fadeIn(200);
  });

  // بستن مودال با دکمه X
  $('#closeInsertTableBtn').on('click', function () {
    $('#insertTableModal').fadeOut(200);
  });

  // بستن مودال با کلیک بیرون
  $('#insertTableModal').on('click', function (e) {
    if ($(e.target).is('#insertTableModal')) {
      $('#insertTableModal').fadeOut(200);
    }
  });

  $('#submitTableBtn').on('click', function () {
    const tableName = $('#tableNameInput').val().trim();
    if (!tableName) return;

    $.ajax({
      url: 'save_table.php',
      method: 'POST',
      data: JSON.stringify({ name: tableName }),
      contentType: 'application/json',
      success: function () {
        $('#insertTableModal').fadeOut(200);
        $('#successMessage').text('میز جدید با موفقیت ثبت شد.').fadeIn(300);
        setTimeout(() => $('#successMessage').fadeOut(300), 3000);
        loadTables();
      },
      error: function () {
        $('#insertTableModal').fadeOut(200);
        $('#errorMessage').text('خطا در ثبت میز.').fadeIn(300);
        setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      }
    });
  });



  let tableToDeleteId = null;
  let tableToDeleteName = '';

  $(document).on('click', '.btn-delete', function () {
    tableToDeleteId = $(this).data('id');
    tableToDeleteName = $(this).closest('.table-box').find('.btn-reserve').text().replace('رزرو ', '');

    $('#deleteMessage').text(`آیا مطمئن هستید میز "${tableToDeleteName}" حذف شود؟`);
    $('#confirmDeleteModal').fadeIn(200);
  });

  // بستن مودال با X یا دکمه خیر یا کلیک بیرون
  $('#closeDeleteModalBtn, #cancelDeleteBtn').on('click', function () {
    $('#confirmDeleteModal').fadeOut(200);
  });

  $('#confirmDeleteModal').on('click', function (e) {
    if ($(e.target).is('#confirmDeleteModal')) {
      $('#confirmDeleteModal').fadeOut(200);
    }
  });

  // تأیید حذف میز
  $('#confirmDeleteBtn').on('click', function () {
    if (!tableToDeleteId) return;

    $.ajax({
      url: 'delete_table.php',
      method: 'POST',
      data: JSON.stringify({ id: tableToDeleteId }),
      contentType: 'application/json',
      success: function (response) {
        $('#confirmDeleteModal').fadeOut(200);
        $('#successMessage').text(response).fadeIn(300);
        setTimeout(() => $('#successMessage').fadeOut(300), 3000);
        loadTables(); // 🔁 به‌روزرسانی کارت‌ها
      },
      error: function (xhr) {
        $('#confirmDeleteModal').fadeOut(200);
        $('#errorMessage').text(xhr.responseText || 'خطا در حذف میز.').fadeIn(300);
        setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      }
    });
  });









  let currentTableId = null;

  $(document).on('click', '.btn-reserve', function () {
    currentTableId = $(this).data('id');

    const today = new Date().toISOString().split('T')[0];

    // مقداردهی فقط تاریخ، بدون ساعت
    $('#reserveDateInput').val(today);
    $('#customerNameInput').val('');
    $('#startReserveTimeInput').val('');
    $('#endReserveTimeInput').val('');

    $('#reserveModal').fadeIn(200);
  });

  $('#closeReserveModalBtn, #cancelReserveBtn').on('click', function () {
    $('#reserveModal').fadeOut(200);
  });

  $('#reserveModal').on('click', function (e) {
    if ($(e.target).is('#reserveModal')) {
      $('#reserveModal').fadeOut(200);
    }
  });

  $('#submitReserveBtn').on('click', function () {
    const date = $('#reserveDateInput').val();
    const name = $('#customerNameInput').val().trim();
    const start = $('#startReserveTimeInput').val();
    const end = $('#endReserveTimeInput').val();

    if (!date || !name || !start || !end || !currentTableId) {
      $('#errorMessage').text('لطفاً همه فیلدها را کامل کنید.').fadeIn(300);
      setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      return;
    }

    const data = {
      table_id: currentTableId,
      date: date,
      customer: name,
      start_time: start,
      end_time: end
    };

    $.ajax({
      url: 'save_reservation.php',
      method: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function (response) {
        $('#reserveModal').fadeOut(200);
        $('#successMessage').text(response).fadeIn(300);
        setTimeout(() => $('#successMessage').fadeOut(300), 3000);
        loadTables(); // 🔁 به‌روزرسانی کارت‌ها
      },
      error: function (xhr) {
        $('#reserveModal').fadeOut(200);
        $('#errorMessage').text(xhr.responseText || 'خطا در ثبت رزرو.').fadeIn(300);
        setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      }
    });
  });

});