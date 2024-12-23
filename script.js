/***************************************************
 * صفحة المسؤول (admin.html) - تعديلات
 ***************************************************/

// مراجع الـtbody لكل حالة
var pendingTableBody = document.getElementById("pendingReservationsTableBody");
var acceptedTableBody = document.getElementById("acceptedReservationsTableBody");
var rejectedTableBody = document.getElementById("rejectedReservationsTableBody");

// مراجع المودال وأزرار الحفظ
var editModal = document.getElementById("editModal");
var saveEditBtn = document.getElementById("saveEditBtn");

// حقول التعديل داخل المودال
var editBookingDate = document.getElementById("editBookingDate");
var editMeetingStart = document.getElementById("editMeetingStart");
var editMeetingDuration = document.getElementById("editMeetingDuration");

// متغيرات لتخزين معلومات الحجز قيد التعديل
var currentEditDateKey = null;  // تاريخ الحجز (key)
var currentEditResKey = null;   // معرّف الحجز (key)

/**
 * دالة لطباعة الحجز في نافذة مستقلة
 */
function printReservation(resData) {
  // فتح نافذة جديدة
  let printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  // محتوى الـHTML في نافذة الطباعة
  printWindow.document.write(`
    <html dir="rtl">
    <head>
      <title>طباعة الحجز</title>
      <style>
        body {
          font-family: 'SSTArabicRoman', sans-serif;
          margin: 20px;
          padding: 0;
        }
        .print-container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #ccc;
          padding: 20px;
          border-radius: 8px;
        }
        .header-logo {
          text-align: right;
          margin-bottom: 20px;
        }
        .header-logo img {
          height: 50px;
        }
        .print-title {
          text-align: center;
          font-family: 'SSTArabicBold', sans-serif;
          font-size: 1.5rem;
          margin: 10px 0 20px;
          color: #0a7951;
        }
        .details p {
          margin: 6px 0;
        }
        .bold {
          font-family: 'SSTArabicBold', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="header-logo">
          <img src="logo-new.png" alt="logo"/>
        </div>
        <h2 class="print-title">نموذج حجز قاعة اجتماع</h2>

        <div class="details">
          <p><span class="bold">اسم المنسق:</span> ${resData.coordinatorName}</p>
          <p><span class="bold">رقم الجوال:</span> ${resData.coordinatorPhone}</p>
          <p><span class="bold">البريد الإلكتروني:</span> ${resData.coordinatorEmail}</p>
          <p><span class="bold">اسم الإدارة:</span> ${resData.departmentName}</p>
          <hr/>
          <p><span class="bold">تاريخ الحجز:</span> ${resData.bookingDate}</p>
          <p><span class="bold">الوقت:</span> من ${resData.startTime} إلى ${resData.endTime}</p>
          <p><span class="bold">المدة (ساعات):</span> ${resData.duration}</p>
          <p><span class="bold">الحالة:</span> ${resData.status}</p>
        </div>
      </div>
      <script>
        window.print();
        window.close();
      </script>
    </body>
    </html>
  `);
}

/**
 * دالة لتحميل وعرض جميع الحجوزات وتصنيفها
 */
function loadReservations() {
  database.ref("reservations").on("value", (snapshot) => {
    // تفريغ الجداول
    pendingTableBody.innerHTML = "";
    acceptedTableBody.innerHTML = "";
    rejectedTableBody.innerHTML = "";

    snapshot.forEach((dateSnap) => {
      // dateSnap.key -> التاريخ
      dateSnap.forEach((resSnap) => {
        let resData = resSnap.val();
        let status = resData.status || "معلق";

        // ننشئ صفًا
        let tr = document.createElement("tr");

        // زر موافقة
        let approveBtn = `<button class="btn btn-success btn-sm mx-1" data-date="${dateSnap.key}" data-key="${resSnap.key}">موافقة</button>`;
        // زر رفض
        let rejectBtn = `<button class="btn btn-danger btn-sm mx-1" data-date="${dateSnap.key}" data-key="${resSnap.key}">رفض</button>`;
        // زر حذف
        let deleteBtn = `<button class="btn btn-outline-danger btn-sm mx-1" data-date="${dateSnap.key}" data-key="${resSnap.key}">حذف</button>`;

        // زر تعديل (للحجوزات المعلقة فقط)
        let editBtn = `
          <button
            class="btn btn-warning btn-sm mx-1"
            data-date="${dateSnap.key}"
            data-key="${resSnap.key}"
          >تعديل</button>
        `;

        // زر طباعة (للحجوزات المقبولة)
        let printBtn = `
          <button
            class="btn btn-secondary btn-sm mx-1"
            data-date="${dateSnap.key}"
            data-key="${resSnap.key}"
          >طباعة</button>
        `;

        // بنية الصف
        tr.innerHTML = `
          <td>${resData.coordinatorName}</td>
          <td>${resData.coordinatorPhone}</td>
          <td>${resData.coordinatorEmail}</td>
          <td>${resData.departmentName}</td>
          <td>${resData.bookingDate}</td>
          <td>${resData.startTime}</td>
          <td>${resData.endTime}</td>
          <td id="actionsCell"></td>
        `;

        let actionsCell = tr.querySelector("#actionsCell");

        // التفرقة حسب الحالة
        if (status === "معلق") {
          // معلق => موافقة/رفض/تعديل/حذف
          actionsCell.innerHTML = approveBtn + rejectBtn + editBtn + deleteBtn;
          pendingTableBody.appendChild(tr);
        } else if (status === "مقبول") {
          // مقبول => طباعة/حذف
          actionsCell.innerHTML = printBtn + deleteBtn;
          acceptedTableBody.appendChild(tr);
        } else if (status === "مرفوض") {
          // مرفوض => حذف
          actionsCell.innerHTML = deleteBtn;
          rejectedTableBody.appendChild(tr);
        }

        // إضافة الأحداث (موافقة - رفض - حذف - تعديل - طباعة)
        actionsCell.querySelectorAll("button").forEach((btn) => {
          let dateKey = btn.getAttribute("data-date");
          let resKey = btn.getAttribute("data-key");

          btn.addEventListener("click", () => {
            if (btn.textContent.includes("موافقة")) {
              // تحديث الحالة إلى مقبول
              database.ref("reservations/" + dateKey + "/" + resKey).update({ status: "مقبول" });
            } 
            else if (btn.textContent.includes("رفض")) {
              // تحديث الحالة إلى مرفوض
              database.ref("reservations/" + dateKey + "/" + resKey).update({ status: "مرفوض" });
            }
            else if (btn.textContent.includes("حذف")) {
              // حذف الحجز نهائيًا
              if (confirm("هل أنت متأكد من حذف هذا الحجز؟")) {
                database.ref("reservations/" + dateKey + "/" + resKey).remove();
              }
            }
            else if (btn.textContent.includes("تعديل")) {
              // فتح المودال وتعبئة الحقول
              currentEditDateKey = dateKey;
              currentEditResKey = resKey;

              // قراءة بيانات الحجز من قاعدة البيانات
              database.ref("reservations/" + dateKey + "/" + resKey).once("value").then((snap) => {
                let data = snap.val();
                if (data) {
                  // تعبئة الحقول
                  editBookingDate.value = data.bookingDate;
                  editMeetingStart.value = data.startTime;
                  editMeetingDuration.value = data.duration;
                  // فتح المودال (Bootstrap)
                  let modal = new bootstrap.Modal(editModal);
                  modal.show();
                }
              });
            }
            else if (btn.textContent.includes("طباعة")) {
              // طباعة الحجز
              database.ref("reservations/" + dateKey + "/" + resKey).once("value").then((snap) => {
                let data = snap.val();
                if (data) {
                  printReservation(data);
                }
              });
            }
          });
        });
      });
    });
  });
}

// استدعاء الدالة عند تحميل الصفحة
loadReservations();

/**
 * حفظ التعديلات (داخل المودال) للحجوزات المعلقة
 */
if (saveEditBtn) {
  saveEditBtn.addEventListener("click", () => {
    if (!currentEditDateKey || !currentEditResKey) return;

    let newDate = editBookingDate.value;
    let newStart = editMeetingStart.value;
    let newDuration = parseInt(editMeetingDuration.value || "1");

    // نحسب وقت النهاية الجديد
    const toMinutes = (timeStr) => {
      const [hh, mm] = timeStr.split(":");
      return parseInt(hh) * 60 + parseInt(mm);
    };
    const toHHMM = (minutes) => {
      let h = Math.floor(minutes / 60);
      let m = minutes % 60;
      if (h < 10) h = "0" + h;
      if (m < 10) m = "0" + m;
      return `${h}:${m}`;
    };

    let startInMins = toMinutes(newStart);
    let endInMins = startInMins + newDuration * 60;
    let endTimeStr = toHHMM(endInMins);

    // تحديث البيانات
    database.ref(`reservations/${currentEditDateKey}/${currentEditResKey}`)
      .once("value")
      .then((snap) => {
        let oldData = snap.val() || {};
        // لو أردنا تحديث التاريخ أيضًا، قد نضطر لنقل الحجز من تاريخ قديم إلى تاريخ جديد.
        // في هذا المثال البسيط، سنبقى في نفس التاريخ (للإيجاز)، أو سنسمح بتغيير التاريخ في نفس المسار.
        // يفضّل في حالة تغيير التاريخ فعليًا حذفه من مسار التاريخ القديم وإنشاؤه في مسار التاريخ الجديد.
        // هنا نفترض أننا نبقيه في نفس المسار (تنبيه: هذا لا يعكس الواقع تمامًا إن غيّر المستخدم اليوم فعلاً).

        let updatedData = {
          ...oldData,
          bookingDate: newDate,
          startTime: newStart,
          duration: newDuration,
          endTime: endTimeStr,
        };

        // حفظ التعديل
        database.ref(`reservations/${currentEditDateKey}/${currentEditResKey}`).set(updatedData)
          .then(() => {
            alert("تم حفظ التعديلات بنجاح.");
            // إغلاق المودال
            let modalInstance = bootstrap.Modal.getInstance(editModal);
            modalInstance.hide();
          })
          .catch((err) => {
            console.error("Error updating reservation: ", err);
          });
      });
  });
}