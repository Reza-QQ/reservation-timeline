function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Modern tooltip function
  let currentTooltip = null;
  
  function showModernTooltip(element, text) {
    hideModernTooltip();
    
    const tooltip = $('<div class="modern-tooltip"></div>').text(text);
    $('body').append(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipWidth = tooltip.outerWidth();
    
    tooltip.css({
      left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
      top: rect.top - tooltip.outerHeight() - 10
    });
    
    setTimeout(() => tooltip.addClass('show'), 10);
    currentTooltip = tooltip;
  }
  
  function hideModernTooltip() {
    if (currentTooltip) {
      currentTooltip.removeClass('show');
      setTimeout(() => currentTooltip.remove(), 300);
      currentTooltip = null;
    }
  }

  // Check if text fits in element
  function adjustReservationBarText() {
    $('.reservation-bar.reserved, .reservation-bar.free').each(function() {
      const $bar = $(this);
      const barWidth = $bar.width();
      const $startTime = $bar.find('span:first');
      const $customer = $bar.find('span:eq(1)');
      const $endTime = $bar.find('span:last');
      
      // Reset classes
      $startTime.removeClass('vertical hidden');
      $customer.removeClass('hidden');
      $endTime.removeClass('vertical hidden');
      
      const fullText = `${$endTime.text()} - ${$customer.text()} - ${$startTime.text()}`;
      
      // Very small blocks (less than 60px) - hide all text but show tooltip
      if (barWidth < 60) {
        $startTime.addClass('hidden');
        $customer.addClass('hidden');
        $endTime.addClass('hidden');
        
        $bar.off('mouseenter mouseleave').hover(
          function(e) { showModernTooltip(this, fullText); },
          function() { hideModernTooltip(); }
        );
      }
      // Small blocks (60-120px) - make times vertical, truncate customer
      else if (barWidth < 120) {
        $startTime.addClass('vertical');
        $endTime.addClass('vertical');
        
        const customerText = $customer.text();
        if (customerText.length > 3) {
          $customer.text(customerText.substring(0, 3) + '...');
        }
        
        $bar.off('mouseenter mouseleave').hover(
          function(e) { showModernTooltip(this, fullText); },
          function() { hideModernTooltip(); }
        );
      }
      // Medium blocks (120-200px) - truncate customer name
      else if (barWidth < 200) {
        const customerText = $customer.text();
        const maxChars = Math.floor(barWidth / 15);
        if (customerText.length > maxChars) {
          $customer.text(customerText.substring(0, maxChars) + '...');
          
          $bar.off('mouseenter mouseleave').hover(
            function(e) { showModernTooltip(this, fullText); },
            function() { hideModernTooltip(); }
          );
        }
      }
    });
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
              .filter(r => String(r.table_id) === String(table.id) && r.date === today)
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
                <div class="reservation-bar reserved editable" 
                     style="right:${leftPercent}%; width:${widthPercent}%; cursor: pointer;"
                     data-table-id="${table.id}"
                     data-date="${res.date}"
                     data-customer="${res.customer}"
                     data-start-time="${res.start_time}"
                     data-end-time="${res.end_time}">
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
          
          // Adjust text after rendering
          setTimeout(adjustReservationBarText, 100);
        });
      });
    });
  }
  
  // Window resize handler
  $(window).on('resize', function() {
    adjustReservationBarText();
  });


$(document).ready(function () {

  // Circular Time Picker
  let currentTimeInput = null;
  let selectedHour = 0;
  let selectedMinute = 0;
  let currentMode = 'hour';
  
  function initCircularTimePicker() {
    renderClockNumbers('hour');
    
    $('.mode-btn').on('click', function() {
      $('.mode-btn').removeClass('active');
      $(this).addClass('active');
      currentMode = $(this).data('mode');
      renderClockNumbers(currentMode);
      updateClockHand();
    });
    
    $('#confirmTimePicker').on('click', function() {
      if (currentTimeInput) {
        const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        $(currentTimeInput).val(timeStr);
      }
      closeTimePicker();
    });
    
    $('#cancelTimePicker, #timePickerOverlay').on('click', function() {
      closeTimePicker();
    });
  }
  
  function renderClockNumbers(mode) {
    const $container = $('#clockNumbers');
    $container.empty();
    
    if (mode === 'hour') {
      // Two concentric circles for 24-hour format
      // Inner circle: 1-12
      const innerRadius = 80;
      for (let i = 1; i <= 12; i++) {
        const angle = (i / 12) * 360 - 90;
        const radian = (angle * Math.PI) / 180;
        const x = 140 + innerRadius * Math.cos(radian) - 16;
        const y = 140 + innerRadius * Math.sin(radian) - 16;
        
        const $number = $(`<div class="clock-number" data-value="${i}">${i}</div>`);
        $number.css({ left: x + 'px', top: y + 'px' });
        
        if (i === selectedHour) {
          $number.addClass('selected');
        }
        
        $number.on('click', function() {
          selectedHour = parseInt($(this).data('value'));
          updateTimeDisplay();
          updateClockHand();
          renderClockNumbers(mode);
          
          setTimeout(() => {
            $('.mode-btn[data-mode="minute"]').click();
          }, 300);
        });
        
        $container.append($number);
      }
      
      // Outer circle: 13-23 and 0
      const outerRadius = 120;
      for (let i = 13; i <= 23; i++) {
        const angle = ((i - 12) / 12) * 360 - 90;
        const radian = (angle * Math.PI) / 180;
        const x = 140 + outerRadius * Math.cos(radian) - 16;
        const y = 140 + outerRadius * Math.sin(radian) - 16;
        
        const $number = $(`<div class="clock-number" data-value="${i}">${i}</div>`);
        $number.css({ left: x + 'px', top: y + 'px' });
        
        if (i === selectedHour) {
          $number.addClass('selected');
        }
        
        $number.on('click', function() {
          selectedHour = parseInt($(this).data('value'));
          updateTimeDisplay();
          updateClockHand();
          renderClockNumbers(mode);
          
          setTimeout(() => {
            $('.mode-btn[data-mode="minute"]').click();
          }, 300);
        });
        
        $container.append($number);
      }
      
      // Add 0 (midnight) at 12 o'clock position on outer circle
      const angle0 = (12 / 12) * 360 - 90;
      const radian0 = (angle0 * Math.PI) / 180;
      const x0 = 140 + outerRadius * Math.cos(radian0) - 16;
      const y0 = 140 + outerRadius * Math.sin(radian0) - 16;
      
      const $number0 = $(`<div class="clock-number" data-value="0">00</div>`);
      $number0.css({ left: x0 + 'px', top: y0 + 'px' });
      
      if (selectedHour === 0) {
        $number0.addClass('selected');
      }
      
      $number0.on('click', function() {
        selectedHour = 0;
        updateTimeDisplay();
        updateClockHand();
        renderClockNumbers(mode);
        
        setTimeout(() => {
          $('.mode-btn[data-mode="minute"]').click();
        }, 300);
      });
      
      $container.append($number0);
    } else {
      // Minutes: single circle with 5-minute intervals
      const radius = 120;
      for (let i = 0; i < 60; i += 5) {
        const angle = (i / 60) * 360 - 90;
        const radian = (angle * Math.PI) / 180;
        const x = 140 + radius * Math.cos(radian) - 16;
        const y = 140 + radius * Math.sin(radian) - 16;
        
        const $number = $(`<div class="clock-number" data-value="${i}">${i.toString().padStart(2, '0')}</div>`);
        $number.css({ left: x + 'px', top: y + 'px' });
        
        if (i === selectedMinute) {
          $number.addClass('selected');
        }
        
        $number.on('click', function() {
          selectedMinute = parseInt($(this).data('value'));
          updateTimeDisplay();
          updateClockHand();
          renderClockNumbers(mode);
        });
        
        $container.append($number);
      }
    }
  }
  
function updateClockHand() {
  let angle;

  if (currentMode === 'hour') {
    // Convert 24-hour to 12-hour position for the clock hand
    const hour12 = selectedHour % 12 || 12;
    angle = (hour12 / 12) * 360;
  } else {
    // Minutes
    angle = (selectedMinute / 60) * 360;
  }

  // اصلاح زاویه پایه (اگر ساعت 12 در بالا باشه، نیازی به offset نیست)
  $('#clockHand').css('transform', `translateX(-50%) rotate(${angle}deg)`);
}

  
  function updateTimeDisplay() {
    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    $('#timeDisplay').text(timeStr);
  }
  
  function openTimePicker(input) {
    currentTimeInput = input;
    const currentValue = $(input).val() || '00:00';
    const [h, m] = currentValue.split(':').map(Number);
    selectedHour = h;
    selectedMinute = m;
    currentMode = 'hour';
    
    $('.mode-btn').removeClass('active');
    $('.mode-btn[data-mode="hour"]').addClass('active');
    
    updateTimeDisplay();
    renderClockNumbers('hour');
    updateClockHand();
    
    $('#timePickerOverlay').addClass('show');
    $('#circularTimePicker').addClass('show');
  }
  
  function closeTimePicker() {
    $('#timePickerOverlay').removeClass('show');
    $('#circularTimePicker').removeClass('show');
    currentTimeInput = null;
  }
  
  // Attach to all time inputs
  $(document).on('click', '.time-input', function() {
    openTimePicker(this);
  });
  
  initCircularTimePicker();

  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const timeString = `${hours}:${minutes}`;
    $('#clock').text(timeString);
  }

  updateClock();
  setInterval(updateClock, 10000);

  // --- Persian Datepicker ---
  // Initialize the picker lazily when the reserve modal/input is used.
  function initReserveDatepicker() {
    // guard to avoid double initialization
    if ($('#reserveDateInput').data('pdp-initialized')) return;

    $('#reserveDateInput').persianDatepicker({
      format: 'YYYY-MM-DD',
      initialValue: false,
      autoClose: true,
      calendarType: 'persian',
      observer: true,
      calendar: {
        persian: {
          leapYearMode: 'astronomical'
        }
      },
      toolbox: { calendarSwitch: { enabled: false } }
    });

    $('#reserveDateInput').data('pdp-initialized', true);
  }

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
    initReserveDatepicker();
    //const date = new persianDate(new Date(new Date().setDate(new Date().getDate() + 1)));
    const date = new persianDate(new Date());
    $('#reserveDateInput').val(date.format('YYYY-MM-DD'));
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



  // ویرایش رزرو
  let editReservationData = null;

  $(document).on('click', '.reservation-bar.reserved.editable', function () {
    const $bar = $(this);
    
    editReservationData = {
      table_id: $bar.data('table-id'),
      date: $bar.data('date'),
      customer: $bar.data('customer'),
      start_time: $bar.data('start-time'),
      end_time: $bar.data('end-time')
    };

    $('#editCustomerNameInput').val(editReservationData.customer);
    $('#editStartReserveTimeInput').val(editReservationData.start_time);
    $('#editEndReserveTimeInput').val(editReservationData.end_time);

    $('#editReserveModal').fadeIn(200);
  });

  $('#closeEditReserveModalBtn, #cancelEditReserveBtn').on('click', function () {
    $('#editReserveModal').fadeOut(200);
  });

  $('#editReserveModal').on('click', function (e) {
    if ($(e.target).is('#editReserveModal')) {
      $('#editReserveModal').fadeOut(200);
    }
  });

  $('#saveEditReserveBtn').on('click', function () {
    const name = $('#editCustomerNameInput').val().trim();
    const start = $('#editStartReserveTimeInput').val();
    const end = $('#editEndReserveTimeInput').val();

    if (!name || !start || !end || !editReservationData) {
      $('#errorMessage').text('لطفاً همه فیلدها را کامل کنید.').fadeIn(300);
      setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      return;
    }

    const data = {
      table_id: editReservationData.table_id,
      date: editReservationData.date,
      old_start_time: editReservationData.start_time,
      customer: name,
      start_time: start,
      end_time: end
    };

    $.ajax({
      url: 'edit_reservation.php',
      method: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function (response) {
        $('#editReserveModal').fadeOut(200);
        $('#successMessage').text(response).fadeIn(300);
        setTimeout(() => $('#successMessage').fadeOut(300), 3000);
        loadTables(); // 🔁 به‌روزرسانی کارت‌ها
      },
      error: function (xhr) {
        $('#editReserveModal').fadeOut(200);
        $('#errorMessage').text(xhr.responseText || 'خطا در ویرایش رزرو.').fadeIn(300);
        setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      }
    });
  });

  // حذف رزرو
  $('#deleteReservationBtn').on('click', function() {
    
    const name = $('#editCustomerNameInput').val().trim();
    const start = $('#editStartReserveTimeInput').val();
    const end = $('#editEndReserveTimeInput').val();

    const data = {
      table_id: editReservationData.table_id,
      date: editReservationData.date,
      old_start_time: editReservationData.start_time,
      customer: name,
      start_time: start,
      end_time: end
    };

    // فرض: شناسه رزرو در متغیر editReservationId ذخیره شده
    $.ajax({
      url: 'delete_reservation.php',
      method: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function(response) {
        $('#editReserveModal').fadeOut(200);
        $('#successMessage').text(response).fadeIn(300);
        setTimeout(() => $('#successMessage').fadeOut(300), 3000);
        loadTables(); // 🔁 به‌روزرسانی کارت‌ها
      },
      error: function (xhr) {
        $('#editReserveModal').fadeOut(200);
        $('#errorMessage').text(xhr.responseText || 'خطا در حذف رزرو.').fadeIn(300);
        setTimeout(() => $('#errorMessage').fadeOut(300), 3000);
      }
    });
  });

});