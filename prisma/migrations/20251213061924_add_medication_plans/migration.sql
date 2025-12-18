-- CreateTable
CREATE TABLE "PatientMedicine" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "dosagePerDay" DOUBLE PRECISION NOT NULL,
    "unitsPerPack" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationPlan" (
    "id" SERIAL NOT NULL,
    "patientMedicineId" INTEGER NOT NULL,
    "dosagePerDay" DOUBLE PRECISION NOT NULL,
    "notifyBeforeDays" INTEGER NOT NULL DEFAULT 3,
    "reminderTimes" JSONB,
    "timezone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "medicationPlanId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationReport" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER,
    "medicineId" INTEGER,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "avgSellingPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientMedicine_customerId_idx" ON "PatientMedicine"("customerId");

-- CreateIndex
CREATE INDEX "PatientMedicine_medicineId_idx" ON "PatientMedicine"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicine_customerId_medicineId_key" ON "PatientMedicine"("customerId", "medicineId");

-- CreateIndex
CREATE INDEX "Reminder_scheduledAt_idx" ON "Reminder"("scheduledAt");

-- CreateIndex
CREATE INDEX "Reminder_customerId_idx" ON "Reminder"("customerId");

-- AddForeignKey
ALTER TABLE "PatientMedicine" ADD CONSTRAINT "PatientMedicine_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicine" ADD CONSTRAINT "PatientMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "MedicineItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPlan" ADD CONSTRAINT "MedicationPlan_patientMedicineId_fkey" FOREIGN KEY ("patientMedicineId") REFERENCES "PatientMedicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_medicationPlanId_fkey" FOREIGN KEY ("medicationPlanId") REFERENCES "MedicationPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationReport" ADD CONSTRAINT "MedicationReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationReport" ADD CONSTRAINT "MedicationReport_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "MedicineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
