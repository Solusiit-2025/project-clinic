--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: clinic
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO clinic;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: clinic
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: clinic
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'DOCTOR',
    'RECEPTIONIST',
    'FARMASI',
    'ACCOUNTING',
    'LOGISTIC',
    'STAFF'
);


ALTER TYPE public."Role" OWNER TO clinic;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO clinic;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    module text NOT NULL,
    description text,
    "changedData" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO clinic;

--
-- Name: appointment_services; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.appointment_services (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    "serviceId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    subtotal double precision NOT NULL
);


ALTER TABLE public.appointment_services OWNER TO clinic;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    "appointmentNo" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "appointmentDate" timestamp(3) without time zone NOT NULL,
    "appDurationMin" integer DEFAULT 30 NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    "cancelReason" text,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.appointments OWNER TO clinic;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.assets (
    id text NOT NULL,
    "assetCode" text NOT NULL,
    "assetName" text NOT NULL,
    "assetType" text NOT NULL,
    category text NOT NULL,
    description text,
    "serialNumber" text,
    manufacturer text,
    model text,
    "purchaseDate" timestamp(3) without time zone NOT NULL,
    "purchasePrice" double precision NOT NULL,
    "currentValue" double precision,
    condition text DEFAULT 'good'::text NOT NULL,
    location text,
    supplier text,
    "warrantyExpiry" timestamp(3) without time zone,
    "maintenanceSchedule" text,
    "lastMaintenanceDate" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    "attachmentUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text,
    image text,
    "masterProductId" text
);


ALTER TABLE public.assets OWNER TO clinic;

--
-- Name: clinics; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.clinics (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    phone text,
    email text,
    logo text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isMain" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.clinics OWNER TO clinic;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.departments (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    "parentId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "clinicId" text
);


ALTER TABLE public.departments OWNER TO clinic;

--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.doctor_schedules (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "dayOfWeek" text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.doctor_schedules OWNER TO clinic;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.doctors (
    id text NOT NULL,
    "userId" text NOT NULL,
    "licenseNumber" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    specialization text NOT NULL,
    bio text,
    "profilePicture" text,
    "yearsOfExperience" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" text,
    "queueCode" text
);


ALTER TABLE public.doctors OWNER TO clinic;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.expense_categories (
    id text NOT NULL,
    "categoryName" text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO clinic;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    "expenseNo" text NOT NULL,
    "categoryId" text NOT NULL,
    description text NOT NULL,
    amount double precision NOT NULL,
    "expenseDate" timestamp(3) without time zone NOT NULL,
    "paymentMethod" text,
    "approvedBy" text,
    status text DEFAULT 'approved'::text NOT NULL,
    notes text,
    "attachmentUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.expenses OWNER TO clinic;

--
-- Name: financial_reports; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.financial_reports (
    id text NOT NULL,
    "reportDate" timestamp(3) without time zone NOT NULL,
    "reportType" text NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "totalExpense" double precision DEFAULT 0 NOT NULL,
    "totalProfit" double precision DEFAULT 0 NOT NULL,
    "totalPatients" integer DEFAULT 0 NOT NULL,
    "totalAppointments" integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.financial_reports OWNER TO clinic;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.inventory (
    id text NOT NULL,
    "itemCode" text NOT NULL,
    "medicineId" text,
    "itemName" text NOT NULL,
    description text,
    category text NOT NULL,
    unit text NOT NULL,
    quantity integer NOT NULL,
    "minimumStock" integer NOT NULL,
    "reorderQuantity" integer NOT NULL,
    "purchasePrice" double precision NOT NULL,
    "sellingPrice" double precision,
    supplier text,
    "lastPurchaseDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    location text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.inventory OWNER TO clinic;

--
-- Name: inventory_adjustments; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.inventory_adjustments (
    id text NOT NULL,
    "inventoryId" text NOT NULL,
    "adjustmentType" text NOT NULL,
    quantity integer NOT NULL,
    reason text NOT NULL,
    notes text,
    "approvedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventory_adjustments OWNER TO clinic;

--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.inventory_transactions (
    id text NOT NULL,
    "inventoryId" text NOT NULL,
    "transactionType" text NOT NULL,
    quantity integer NOT NULL,
    "referenceNo" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_transactions OWNER TO clinic;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.invoice_items (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "serviceId" text NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    subtotal double precision NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO clinic;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "invoiceNo" text NOT NULL,
    "appointmentId" text,
    "patientId" text NOT NULL,
    "invoiceDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    subtotal double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    tax double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    "amountPaid" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'unpaid'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.invoices OWNER TO clinic;

--
-- Name: medical_record_services; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.medical_record_services (
    id text NOT NULL,
    "medicalRecordId" text NOT NULL,
    "serviceId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.medical_record_services OWNER TO clinic;

--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.medical_records (
    id text NOT NULL,
    "recordNo" text NOT NULL,
    "appointmentId" text,
    "patientId" text NOT NULL,
    "doctorId" text,
    "chiefComplaint" text NOT NULL,
    diagnosis text,
    "treatmentPlan" text,
    notes text,
    "recordDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text,
    "registrationId" text,
    "labNotes" text,
    "labResults" text,
    "consultationDraft" jsonb
);


ALTER TABLE public.medical_records OWNER TO clinic;

--
-- Name: medicines; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.medicines (
    id text NOT NULL,
    "medicineName" text NOT NULL,
    "genericName" text,
    description text,
    "dosageForm" text,
    strength text,
    manufacturer text,
    "batchNumber" text,
    "expiryDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    image text,
    "clinicId" text,
    "medicineCode" text
);


ALTER TABLE public.medicines OWNER TO clinic;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.patients (
    id text NOT NULL,
    "medicalRecordNo" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    address text,
    city text,
    province text,
    "zipCode" text,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    "bloodType" text,
    "identityType" text,
    "identityNumber" text,
    "emergencyContact" text,
    "emergencyPhone" text,
    allergies text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bpjsNumber" text,
    "insuranceName" text
);


ALTER TABLE public.patients OWNER TO clinic;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "paymentNo" text NOT NULL,
    "invoiceId" text NOT NULL,
    "paymentDate" timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    "paymentMethod" text NOT NULL,
    "transactionRef" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO clinic;

--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.prescription_items (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicineId" text NOT NULL,
    quantity integer NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text
);


ALTER TABLE public.prescription_items OWNER TO clinic;

--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.prescriptions (
    id text NOT NULL,
    "prescriptionNo" text NOT NULL,
    "medicalRecordId" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "prescriptionDate" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.prescriptions OWNER TO clinic;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    "categoryName" text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_categories OWNER TO clinic;

--
-- Name: product_masters; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.product_masters (
    id text NOT NULL,
    "masterCode" text NOT NULL,
    "masterName" text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "medicineId" text,
    "categoryId" text,
    image text
);


ALTER TABLE public.product_masters OWNER TO clinic;

--
-- Name: products; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.products (
    id text NOT NULL,
    "masterProductId" text NOT NULL,
    "productCode" text NOT NULL,
    sku text NOT NULL,
    "productName" text NOT NULL,
    description text,
    unit text NOT NULL,
    "purchaseUnit" text NOT NULL,
    "storageUnit" text NOT NULL,
    "usedUnit" text NOT NULL,
    quantity integer NOT NULL,
    "minimumStock" integer NOT NULL,
    "reorderQuantity" integer NOT NULL,
    "purchasePrice" double precision NOT NULL,
    "sellingPrice" double precision NOT NULL,
    supplier text,
    "lastPurchaseDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.products OWNER TO clinic;

--
-- Name: queue_numbers; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.queue_numbers (
    id text NOT NULL,
    "queueNo" text NOT NULL,
    "patientId" text NOT NULL,
    "appointmentId" text,
    "queueDate" timestamp(3) without time zone NOT NULL,
    "estimatedTime" timestamp(3) without time zone,
    "actualCallTime" timestamp(3) without time zone,
    status text DEFAULT 'waiting'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text,
    "departmentId" text,
    "doctorId" text,
    "registrationId" text
);


ALTER TABLE public.queue_numbers OWNER TO clinic;

--
-- Name: registrations; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.registrations (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "registrationNo" text NOT NULL,
    "registrationDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    "visitType" text NOT NULL,
    "referralDocument" text,
    "referralFrom" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text,
    "departmentId" text,
    "doctorId" text
);


ALTER TABLE public.registrations OWNER TO clinic;

--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.service_categories (
    id text NOT NULL,
    "categoryName" text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_categories OWNER TO clinic;

--
-- Name: services; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.services (
    id text NOT NULL,
    "serviceCode" text NOT NULL,
    "serviceName" text NOT NULL,
    description text,
    category text,
    unit text,
    price double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text,
    "categoryId" text
);


ALTER TABLE public.services OWNER TO clinic;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.site_settings (
    id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clinicId" text
);


ALTER TABLE public.site_settings OWNER TO clinic;

--
-- Name: user_clinics; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.user_clinics (
    id text NOT NULL,
    "userId" text NOT NULL,
    "clinicId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_clinics OWNER TO clinic;

--
-- Name: users; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."Role" DEFAULT 'STAFF'::public."Role" NOT NULL,
    image text
);


ALTER TABLE public.users OWNER TO clinic;

--
-- Name: vital_signs; Type: TABLE; Schema: public; Owner: clinic
--

CREATE TABLE public.vital_signs (
    id text NOT NULL,
    "medicalRecordId" text NOT NULL,
    temperature double precision,
    "bloodPressure" text,
    "heartRate" integer,
    "respiratoryRate" integer,
    weight double precision,
    height double precision,
    "bloodOxygen" double precision,
    notes text,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vital_signs OWNER TO clinic;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bd7479c8-8733-43a2-80bd-17fd5bb8b605	571ec083a87384798a7acd24b4af6f72619db86827338c78485a6cfae6b4e05f	2026-04-09 17:47:10.123018+07	20260406040521_initd	\N	\N	2026-04-09 17:47:09.977727+07	1
2904629a-38e5-49a6-b39b-68743965aabe	d91cb25f3ff18d77ffcc966d8e7a1d68be6d51b8e5492bd992ccbae7018787eb	2026-04-09 17:47:10.14812+07	20260406041637_initd	\N	\N	2026-04-09 17:47:10.123469+07	1
0e512f1b-d940-41a9-9274-7ffb0fc52ac6	6080795f03393368da273f47593f2d1d4cb35cd4764db95566eb4a27d046af1c	2026-04-09 17:47:10.161506+07	20260407055643_master_data_hierarchy	\N	\N	2026-04-09 17:47:10.14871+07	1
da7d703b-f26c-4fe5-a34a-cc16b828b77e	6db75ef93b66a349fe241bb7292ce6012f20e0d01906917d8826f4e557c54ac9	2026-04-09 17:47:10.199187+07	20260407065912_init_multi_clinic	\N	\N	2026-04-09 17:47:10.162249+07	1
4c7dabed-0dfd-478c-8b6d-79a8afd1fe5a	3c96fc532e11e118bbb41cb8749697d8648d3844d46b89323b1712b30c5fe2fb	2026-04-09 17:47:10.20317+07	20260407070135_add_service_clinic_id	\N	\N	2026-04-09 17:47:10.199619+07	1
a376b6bd-02e8-4b82-b731-0e646d9ef87f	67b20b9e4c690f2036c2a403b3b1fed0edfa1956c115d088f6a80b629196cc1f	2026-04-09 17:47:10.207361+07	20260407070307_add_doctor_schedule_clinic_id	\N	\N	2026-04-09 17:47:10.203608+07	1
ccc8f2cf-2ab6-4770-a6e9-23471a448682	2336f88435ab28b07a8ec56e25c72d917826f3cd221a3c66d47fe3cc5e33a906	2026-04-09 17:47:10.215519+07	20260408001846_initd	\N	\N	2026-04-09 17:47:10.207799+07	1
a2697bf5-3265-439e-b815-1fd19e92a55a	1da391b9da2bf75425ff8608e5770397cf9df782f2146ddb867f651dc677db30	2026-04-09 17:47:10.217374+07	20260408005039_add_user_image_field	\N	\N	2026-04-09 17:47:10.215996+07	1
2d7d37c8-67e1-4622-901e-d6a5dbda243a	1f7f452f53639c17c83cecb7f9583bd2a2a534f07d71c41488dd449b2f7a1c85	2026-04-09 17:47:10.222487+07	20260408025241_link_medicine_product	\N	\N	2026-04-09 17:47:10.21777+07	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.activity_logs (id, "userId", action, module, description, "changedData", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: appointment_services; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.appointment_services (id, "appointmentId", "serviceId", quantity, price, discount, subtotal) FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.appointments (id, "appointmentNo", "patientId", "doctorId", "appointmentDate", "appDurationMin", status, notes, "cancelReason", "cancelledAt", "createdAt", "updatedAt", "clinicId") FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.assets (id, "assetCode", "assetName", "assetType", category, description, "serialNumber", manufacturer, model, "purchaseDate", "purchasePrice", "currentValue", condition, location, supplier, "warrantyExpiry", "maintenanceSchedule", "lastMaintenanceDate", status, notes, "attachmentUrl", "createdAt", "updatedAt", "clinicId", image, "masterProductId") FROM stdin;
2f679595-7f9e-48a8-8bb7-82dc27f7e721	AS-IT-SVR-K001	Server NAS Synology DS923+	computer	IT Infrastructure	Operational Asset for Clinic Support	\N	Synology	DS923+	2026-01-09 11:01:55.453	15500000	14725000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.454	active	\N	\N	2026-04-09 11:01:55.456	2026-04-09 11:02:26.592	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	a91701e0-4e68-452d-9d62-ebb37db8823d
b2cc013e-a4ed-40e5-b3d3-8d4795017105	AS-IT-WIFI-K001	Ubiquiti UniFi Dream Machine Pro (WiFi System)	computer	Networking	Operational Asset for Clinic Support	\N	Ubiquiti	UDM-Pro	2026-01-09 11:01:55.453	9500000	9025000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.464	active	\N	\N	2026-04-09 11:01:55.465	2026-04-09 11:02:26.603	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	6f9eb70f-597d-4acb-b051-65add8a644dc
af99b02b-866a-40a9-b76d-443c57328d27	AS-IT-LP1-K001	Laptop MacBook Air 13" M3 16GB (Manajemen)	computer	Mobile Workstation	Operational Asset for Clinic Support	\N	Apple	MacBook Air M3	2026-01-09 11:01:55.453	21500000	20425000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.468	active	\N	\N	2026-04-09 11:01:55.468	2026-04-09 11:02:26.611	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	8820e22b-4db9-444a-858c-97cf27e64900
265787b4-3efe-49d9-8c82-217ba8ce4026	AS-IT-PC1-K001	PC Desktop Dell Optiplex 7010 (Admin Set)	computer	Workstation	Operational Asset for Clinic Support	\N	Dell	Optiplex 7010	2026-01-09 11:01:55.453	12500000	11875000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.47	active	\N	\N	2026-04-09 11:01:55.471	2026-04-09 11:02:26.617	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	5f63d138-9478-4fe1-83a3-9f673cf850b7
e1e9ed17-5e34-44f4-8713-1ff493c5a050	AS-IT-PRN-K001	Printer Epson L3210 (Multifunction)	computer	Office Equipment	Operational Asset for Clinic Support	\N	Epson	L3210	2026-01-09 11:01:55.453	3200000	3040000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.473	active	\N	\N	2026-04-09 11:01:55.474	2026-04-09 11:02:26.625	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	285a8d39-323c-4e82-a0c6-cc90d126ef61
17124dda-15c9-449d-8f66-12c7f9c30ef8	AS-VEH-CAR-K001	Mobil Operasional Toyota Avanza Veloz	vehicle	Transportation	Operational Asset for Clinic Support	\N	Toyota	Veloz 2024	2026-01-09 11:01:55.453	295000000	280250000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.477	active	\N	\N	2026-04-09 11:01:55.478	2026-04-09 11:02:26.632	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	3b7419c8-d502-45eb-bdc1-e4afe85ffa9f
391b949a-9aaa-4130-9779-c2d6efaa4cbb	AS-VEH-MTR2-K001	Motor Operasional Yamaha NMAX 155	vehicle	Transportation	Operational Asset for Clinic Support	\N	Yamaha	NMAX Connected	2026-01-09 11:01:55.453	35000000	33250000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.481	active	\N	\N	2026-04-09 11:01:55.482	2026-04-09 11:02:26.639	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	ea19caa2-4b7e-4776-8578-b99944912668
f1a546f7-a4b3-4608-958e-a290229b1c74	AS-FAC-CCTV-K001	CCTV System Hikvision 8-CH (Full HD)	equipment	Security	Operational Asset for Clinic Support	\N	Hikvision	Turbo HD 8CH	2026-01-09 11:01:55.453	8500000	8075000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.486	active	\N	\N	2026-04-09 11:01:55.487	2026-04-09 11:02:26.647	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	204d9662-77e6-4abb-8861-82ba45be3070
415a25e1-0e3f-43c5-9bbd-2e151ee3bbff	AS-FAC-ABS-K001	Mesin Absensi Face Recognition (Solution)	equipment	Security	Operational Asset for Clinic Support	\N	Solution	X606-S	2026-01-09 11:01:55.453	4500000	4275000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.489	active	\N	\N	2026-04-09 11:01:55.49	2026-04-09 11:02:26.661	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	8920e3a3-4c11-41bc-b926-5ea9f7dbcbc8
0b69c830-ad54-460b-b9be-702055287307	AS-FAC-AC-R2-K001	AC Panasonic 1PK Inverter (Ruang Periksa 2)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU9XKP	2026-01-09 11:01:55.453	6500000	6175000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.496	active	\N	\N	2026-04-09 11:01:55.496	2026-04-09 11:02:26.685	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	cf7c99b7-a1f2-403a-9539-79ca339dc13b
564d8f3b-649a-4bf3-8f2c-91c7b7701ab5	AS-FAC-AC-W-K001	AC Panasonic 2PK Inverter (Ruang Tunggu)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU18XKP	2026-01-09 11:01:55.453	12500000	11875000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.499	active	\N	\N	2026-04-09 11:01:55.5	2026-04-09 11:02:26.695	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	84bb17c4-e321-4918-a6e9-82b41177393a
ccdaf489-761e-43e7-9674-2c249842e4f9	AS-IT-SVR-K002	Server NAS Synology DS923+	computer	IT Infrastructure	Operational Asset for Clinic Support	\N	Synology	DS923+	2026-01-09 11:01:55.453	15500000	14725000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.454	active	\N	\N	2026-04-10 02:08:02.401	2026-04-10 02:08:02.401	2f33c982-33d9-416b-bb9c-90602896da7d	\N	a91701e0-4e68-452d-9d62-ebb37db8823d
2ab82727-0d8f-472e-85ce-6a86e3ab31d9	AS-IT-WIFI-K002	Ubiquiti UniFi Dream Machine Pro (WiFi System)	computer	Networking	Operational Asset for Clinic Support	\N	Ubiquiti	UDM-Pro	2026-01-09 11:01:55.453	9500000	9025000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.464	active	\N	\N	2026-04-10 02:08:02.411	2026-04-10 02:08:02.411	2f33c982-33d9-416b-bb9c-90602896da7d	\N	6f9eb70f-597d-4acb-b051-65add8a644dc
13da4ffe-bb50-4c68-80e7-9a8ab7ac54c6	AS-IT-LP1-K002	Laptop MacBook Air 13" M3 16GB (Manajemen)	computer	Mobile Workstation	Operational Asset for Clinic Support	\N	Apple	MacBook Air M3	2026-01-09 11:01:55.453	21500000	20425000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.468	active	\N	\N	2026-04-10 02:08:02.413	2026-04-10 02:08:02.413	2f33c982-33d9-416b-bb9c-90602896da7d	\N	8820e22b-4db9-444a-858c-97cf27e64900
afdb8234-efc7-4d25-8efc-20846c5a5011	AS-IT-PC1-K002	PC Desktop Dell Optiplex 7010 (Admin Set)	computer	Workstation	Operational Asset for Clinic Support	\N	Dell	Optiplex 7010	2026-01-09 11:01:55.453	12500000	11875000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.47	active	\N	\N	2026-04-10 02:08:02.417	2026-04-10 02:08:02.417	2f33c982-33d9-416b-bb9c-90602896da7d	\N	5f63d138-9478-4fe1-83a3-9f673cf850b7
27dca106-4f6a-417f-8e04-08e963b6e911	AS-IT-PRN-K002	Printer Epson L3210 (Multifunction)	computer	Office Equipment	Operational Asset for Clinic Support	\N	Epson	L3210	2026-01-09 11:01:55.453	3200000	3040000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.473	active	\N	\N	2026-04-10 02:08:02.42	2026-04-10 02:08:02.42	2f33c982-33d9-416b-bb9c-90602896da7d	\N	285a8d39-323c-4e82-a0c6-cc90d126ef61
87010144-6258-4872-94ab-17d521742abb	AS-VEH-CAR-K002	Mobil Operasional Toyota Avanza Veloz	vehicle	Transportation	Operational Asset for Clinic Support	\N	Toyota	Veloz 2024	2026-01-09 11:01:55.453	295000000	280250000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.477	active	\N	\N	2026-04-10 02:08:02.422	2026-04-10 02:08:02.422	2f33c982-33d9-416b-bb9c-90602896da7d	\N	3b7419c8-d502-45eb-bdc1-e4afe85ffa9f
9bdaf2b3-3539-4593-9132-b52e164ed921	AS-VEH-MTR2-K002	Motor Operasional Yamaha NMAX 155	vehicle	Transportation	Operational Asset for Clinic Support	\N	Yamaha	NMAX Connected	2026-01-09 11:01:55.453	35000000	33250000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.481	active	\N	\N	2026-04-10 02:08:02.425	2026-04-10 02:08:02.425	2f33c982-33d9-416b-bb9c-90602896da7d	\N	ea19caa2-4b7e-4776-8578-b99944912668
dfdab30c-96df-4da8-a040-b4625ce04a15	AS-FAC-CCTV-K002	CCTV System Hikvision 8-CH (Full HD)	equipment	Security	Operational Asset for Clinic Support	\N	Hikvision	Turbo HD 8CH	2026-01-09 11:01:55.453	8500000	8075000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.486	active	\N	\N	2026-04-10 02:08:02.427	2026-04-10 02:08:02.427	2f33c982-33d9-416b-bb9c-90602896da7d	\N	204d9662-77e6-4abb-8861-82ba45be3070
0f8dae5d-8d12-4676-a6d1-a4dc1c243acc	AS-FAC-AC-R1-K001	AC Panasonic 1PK Inverter (Ruang Periksa 1)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU9XKP	2026-01-09 00:00:00	6500000	6175000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.492	active	\N	\N	2026-04-09 11:01:55.494	2026-04-10 02:28:56.471	cdf427a7-bf4d-478e-97e7-7f24c214f584	/uploads/assets/asset-1775788136425.webp	4bc20ee1-e855-49a4-a5d6-e30ce9453b55
9d104230-4718-4e51-b9c8-94d8fdc96107	AS-FAC-ABS-K002	Mesin Absensi Face Recognition (Solution)	equipment	Security	Operational Asset for Clinic Support	\N	Solution	X606-S	2026-01-09 11:01:55.453	4500000	4275000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.489	active	\N	\N	2026-04-10 02:08:02.429	2026-04-10 02:08:02.429	2f33c982-33d9-416b-bb9c-90602896da7d	\N	8920e3a3-4c11-41bc-b926-5ea9f7dbcbc8
228fea13-2907-4f39-b464-257956d01753	AS-FAC-AC-R1-K002	AC Panasonic 1PK Inverter (Ruang Periksa 1)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU9XKP	2026-01-09 00:00:00	6500000	6175000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.492	active	\N	\N	2026-04-10 02:08:02.434	2026-04-10 03:14:10.068	2f33c982-33d9-416b-bb9c-90602896da7d	/uploads/assets/asset-1775790850030.webp	4bc20ee1-e855-49a4-a5d6-e30ce9453b55
30bcb8c9-17c4-4ebd-bfea-30ee9bdb39d7	AS-FAC-AC-R2-K002	AC Panasonic 1PK Inverter (Ruang Periksa 2)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU9XKP	2026-01-09 00:00:00	6500000	6175000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.496	active	\N	\N	2026-04-10 02:08:02.436	2026-04-10 03:14:22.549	2f33c982-33d9-416b-bb9c-90602896da7d	/uploads/assets/asset-1775790862506.webp	cf7c99b7-a1f2-403a-9539-79ca339dc13b
d4fbfe6c-46ce-4079-b9df-11a441eac4c5	AS-FAC-AC-W-K002	AC Panasonic 2PK Inverter (Ruang Tunggu)	furniture	Facility	Operational Asset for Clinic Support	\N	Panasonic	CS-PU18XKP	2026-01-09 00:00:00	12500000	11875000	excellent	\N	\N	\N	Quarterly	2026-04-09 11:01:55.499	active	\N	\N	2026-04-10 02:08:02.437	2026-04-10 03:14:30.863	2f33c982-33d9-416b-bb9c-90602896da7d	/uploads/assets/asset-1775790870816.webp	84bb17c4-e321-4918-a6e9-82b41177393a
3ae3f876-74db-4ee4-a771-f950ee1bd286	MSTR-AS-VEH-AMB-K002-PC-AST	Ambulance Toyota Hiace Medis (Advance)	equipment	AMBULANCE	Untuk Transportasi Pasien 	\N	TOYOTA	B 1865 KFT	2026-04-10 00:00:00	650000000	\N	excellent	\N	\N	\N	\N	\N	active	\N	\N	2026-04-10 02:52:04.259	2026-04-10 03:21:45.657	2f33c982-33d9-416b-bb9c-90602896da7d	/uploads/assets/asset-1775789551922.webp	346f29fa-5cdb-4009-b835-598252be9652
933ec611-b514-4ef2-b098-00a6900e2fa3	MSTR-AS-VEH-AMB-K001-PC-AST	Ambulance Toyota Hiace Medis (Advance)	equipment	AMBULANCE		\N	TOYOTA	F 8782 DKH	2026-04-10 00:00:00	71000000	\N	excellent	\N	\N	\N	\N	\N	active	\N	\N	2026-04-10 03:21:23.399	2026-04-10 03:22:16.023	cdf427a7-bf4d-478e-97e7-7f24c214f584	/uploads/assets/asset-1775791283345.webp	346f29fa-5cdb-4009-b835-598252be9652
\.


--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.clinics (id, name, code, address, phone, email, logo, "isActive", "createdAt", "updatedAt", "isMain") FROM stdin;
cdf427a7-bf4d-478e-97e7-7f24c214f584	Klinik Yasfina Bogor Pusat	K001	Blok EE1, Jl. Villa Bogor Indah, RT.01/RW.14, Kedunghalang, Kec. Bogor Utara, Kota Bogor, Jawa Barat 16157		admin@yasfina.com	\N	t	2026-04-09 10:52:46.875	2026-04-09 11:04:30.259	t
2f33c982-33d9-416b-bb9c-90602896da7d	Klinik Yasfina Bekasi Cabang	K002	Bekasi Timur Regensi, Perum Jl. Raya Bekasi Timur Regensi No.8 Blok G1, RT.001/RW.019, Cimuning, Kec. Mustika Jaya, Kota Bks, Jawa Barat 17155		admin_bekasi@clinic.com	\N	t	2026-04-09 11:05:53.957	2026-04-09 11:05:53.957	f
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.departments (id, name, description, "isActive", "createdAt", "updatedAt", level, "parentId", "sortOrder", "clinicId") FROM stdin;
2261d6e9-0758-4109-884b-20c7ab1bf0d1	Departemen Medis (Core Services)	Jantung operasional klinik. Fokus pada pelayanan medis prima.	t	2026-04-09 11:24:07.167	2026-04-09 11:24:07.167	0	\N	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
b3ba96be-48cf-4e72-8347-da06f6a9485c	Poli Spesialis	Konsultasi dokter spesialis (Estetika, Gigi, Anak, Penyakit Dalam).	t	2026-04-09 11:24:07.169	2026-04-09 11:24:07.169	1	2261d6e9-0758-4109-884b-20c7ab1bf0d1	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
b8abcf87-73bc-431c-9379-651d07db3f1d	Unit Gawat Darurat (UGD) Terbatas	Penanganan awal kegawatdaruratan sebelum rujukan.	t	2026-04-09 11:24:07.171	2026-04-09 11:24:07.171	1	2261d6e9-0758-4109-884b-20c7ab1bf0d1	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
3cdeba8b-20aa-4eaa-9f2f-61c95ea9671f	Keperawatan (Nursing)	Staf perawat terlatih dengan standar keramahan hotel berbintang.	t	2026-04-09 11:24:07.172	2026-04-09 11:24:07.172	1	2261d6e9-0758-4109-884b-20c7ab1bf0d1	3	cdf427a7-bf4d-478e-97e7-7f24c214f584
d9a55e6c-e637-4a05-903e-16d52cf7dc3d	Farmasi	Penyediaan obat-obatan paten dan racikan berkualitas tinggi.	t	2026-04-09 11:24:07.173	2026-04-09 11:24:07.173	1	2261d6e9-0758-4109-884b-20c7ab1bf0d1	4	cdf427a7-bf4d-478e-97e7-7f24c214f584
d6b6f7dd-ff87-42b6-b1e3-670b32c95ea7	Laboratorium & Diagnostik	Fasilitas cek darah, USG, dan radiologi di tempat.	t	2026-04-09 11:24:07.175	2026-04-09 11:24:07.175	1	2261d6e9-0758-4109-884b-20c7ab1bf0d1	5	cdf427a7-bf4d-478e-97e7-7f24c214f584
782b91da-7c46-4f49-97f4-2094e775fe6c	Departemen Patient Experience & Frontliner	Area krusial untuk pelayanan segmen menengah ke atas.	t	2026-04-09 11:24:07.177	2026-04-09 11:24:07.177	0	\N	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
54bb29b9-c545-4c1e-a972-a9523d7d2027	Concierge & Reception	Layanan pendaftaran dengan sistem personal asisten.	t	2026-04-09 11:24:07.178	2026-04-09 11:24:07.178	1	782b91da-7c46-4f49-97f4-2094e775fe6c	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
693dbeb9-0253-42d7-89d2-349d535a46e9	Patient Relations Officer (PRO)	Penanganan keluhan dan kebutuhan khusus pasien secara personal.	t	2026-04-09 11:24:07.179	2026-04-09 11:24:07.179	1	782b91da-7c46-4f49-97f4-2094e775fe6c	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
230651b0-159b-4a07-a734-ba9cbadc9646	Call Center & Telemarketing	Appointment reminder dan layanan purna jual (customer care).	t	2026-04-09 11:24:07.18	2026-04-09 11:24:07.18	1	782b91da-7c46-4f49-97f4-2094e775fe6c	3	cdf427a7-bf4d-478e-97e7-7f24c214f584
bda85e6e-8e8f-487a-a1c5-8dceb2812b9f	Departemen Operasional & Fasilitas	Menjamin kenyamanan fisik dan kelancaran teknis fasilitas.	t	2026-04-09 11:24:07.181	2026-04-09 11:24:07.181	0	\N	3	cdf427a7-bf4d-478e-97e7-7f24c214f584
4d8dfacf-d9b4-463c-a0ce-d275fd8f10b1	Housekeeping (Hospitality Standard)	Kebersihan area klinik dengan standar industri perhotelan.	t	2026-04-09 11:24:07.182	2026-04-09 11:24:07.182	1	bda85e6e-8e8f-487a-a1c5-8dceb2812b9f	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
576de067-a7fc-46b6-a099-7bfcef8523ff	Maintenance & Engineering	Pemeliharaan alat medis dan fasilitas (AC, Wi-Fi, Lift).	t	2026-04-09 11:24:07.184	2026-04-09 11:24:07.184	1	bda85e6e-8e8f-487a-a1c5-8dceb2812b9f	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
aa902c28-2b88-4418-b7b6-50a4740687b0	Purchasing & Inventory	Pengadaan stok bahan medis dan non-medis berkualitas.	t	2026-04-09 11:24:07.185	2026-04-09 11:24:07.185	1	bda85e6e-8e8f-487a-a1c5-8dceb2812b9f	3	cdf427a7-bf4d-478e-97e7-7f24c214f584
2445dc2c-355d-40ad-a4ad-0ea1c3ecce39	Departemen Bisnis & Administrasi	Fungsi manajerial untuk keberlangsungan bisnis klinik.	t	2026-04-09 11:24:07.186	2026-04-09 11:24:07.186	0	\N	4	cdf427a7-bf4d-478e-97e7-7f24c214f584
f68e559b-9a41-4e23-a865-afe7f0fe5a33	Finance, Accounting, & Tax	Pengelolaan arus kas, pelaporan keuangan, dan perpajakan.	t	2026-04-09 11:24:07.187	2026-04-09 11:24:07.187	1	2445dc2c-355d-40ad-a4ad-0ea1c3ecce39	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
f398b816-1b32-40d6-acbb-396b1ada2f1f	Human Resources Development (HRD)	Rekrutmen dan pelatihan staf dengan soft skill pelayanan premium.	t	2026-04-09 11:24:07.188	2026-04-09 11:24:07.188	1	2445dc2c-355d-40ad-a4ad-0ea1c3ecce39	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
a6172a4d-6eea-492c-82e9-73a585d9bf8d	Marketing & Public Relations	Branding, social media, dan kerjasama komunitas eksklusif/asuransi.	t	2026-04-09 11:24:07.19	2026-04-09 11:24:07.19	1	2445dc2c-355d-40ad-a4ad-0ea1c3ecce39	3	cdf427a7-bf4d-478e-97e7-7f24c214f584
78db5982-d368-4b66-afc8-803148908c8f	IT Support	Pengelolaan SIM-Klinik dan keamanan data pasien.	t	2026-04-09 11:24:07.192	2026-04-09 11:24:07.192	1	2445dc2c-355d-40ad-a4ad-0ea1c3ecce39	4	cdf427a7-bf4d-478e-97e7-7f24c214f584
42df489b-53b6-4647-bd0b-02410854cb95	Departemen Penunjang Khusus (Premium Extra)	Nilai tambah untuk keamanan dan kenyamanan VIP.	t	2026-04-09 11:24:07.193	2026-04-09 11:24:07.193	0	\N	5	cdf427a7-bf4d-478e-97e7-7f24c214f584
0192fab9-6c3f-4746-a2f9-6b6a163e821f	Quality Assurance & Komite Medik	Memastikan standar SOP dan keselamatan pasien (Patient Safety).	t	2026-04-09 11:24:07.194	2026-04-09 11:24:07.194	1	42df489b-53b6-4647-bd0b-02410854cb95	1	cdf427a7-bf4d-478e-97e7-7f24c214f584
fe24ef22-7545-48d9-9259-42887a8c2180	Layanan Home Care	Tim medis khusus untuk tindakan di rumah pasien (VIP Home Service).	t	2026-04-09 11:24:07.195	2026-04-09 11:24:07.195	1	42df489b-53b6-4647-bd0b-02410854cb95	2	cdf427a7-bf4d-478e-97e7-7f24c214f584
d824f730-5806-46d5-8905-f0b2c2ab43ce	Departemen Bisnis & Administrasi	Fungsi manajerial untuk keberlangsungan bisnis klinik.	t	2026-04-09 11:30:50.074	2026-04-09 11:30:50.074	0	\N	4	2f33c982-33d9-416b-bb9c-90602896da7d
8e26cd44-097c-4cdc-9f9d-db9349d9c654	Departemen Operasional & Fasilitas	Menjamin kenyamanan fisik dan kelancaran teknis fasilitas.	t	2026-04-09 11:30:50.083	2026-04-09 11:30:50.083	0	\N	3	2f33c982-33d9-416b-bb9c-90602896da7d
6fa427ad-1196-49d6-a606-bd6c54fcdf6d	Departemen Penunjang Khusus (Premium Extra)	Nilai tambah untuk keamanan dan kenyamanan VIP.	t	2026-04-09 11:30:50.084	2026-04-09 11:30:50.084	0	\N	5	2f33c982-33d9-416b-bb9c-90602896da7d
733ce7a8-ca2d-434f-b8f5-1929abf3050e	Departemen Patient Experience & Frontliner	Area krusial untuk pelayanan segmen menengah ke atas.	t	2026-04-09 11:30:50.086	2026-04-09 11:30:50.086	0	\N	2	2f33c982-33d9-416b-bb9c-90602896da7d
63040adc-225b-438b-a33b-79278e9487eb	Departemen Medis (Core Services)	Jantung operasional klinik. Fokus pada pelayanan medis prima.	t	2026-04-09 11:30:50.087	2026-04-09 11:30:50.087	0	\N	1	2f33c982-33d9-416b-bb9c-90602896da7d
4afa4172-a2fd-4f99-8a27-dc2875d5a1cc	Laboratorium & Diagnostik	Fasilitas cek darah, USG, dan radiologi di tempat.	t	2026-04-09 11:30:50.088	2026-04-09 11:30:50.088	1	63040adc-225b-438b-a33b-79278e9487eb	5	2f33c982-33d9-416b-bb9c-90602896da7d
e0470666-20b1-4f88-9b35-ebb8de58e26b	Concierge & Reception	Layanan pendaftaran dengan sistem personal asisten.	t	2026-04-09 11:30:50.089	2026-04-09 11:30:50.089	1	733ce7a8-ca2d-434f-b8f5-1929abf3050e	1	2f33c982-33d9-416b-bb9c-90602896da7d
0b4f4193-be08-405f-898b-b62064469d63	Patient Relations Officer (PRO)	Penanganan keluhan dan kebutuhan khusus pasien secara personal.	t	2026-04-09 11:30:50.09	2026-04-09 11:30:50.09	1	733ce7a8-ca2d-434f-b8f5-1929abf3050e	2	2f33c982-33d9-416b-bb9c-90602896da7d
cc220850-cdff-4a85-abe8-750c2768ce6f	Call Center & Telemarketing	Appointment reminder dan layanan purna jual (customer care).	t	2026-04-09 11:30:50.091	2026-04-09 11:30:50.091	1	733ce7a8-ca2d-434f-b8f5-1929abf3050e	3	2f33c982-33d9-416b-bb9c-90602896da7d
da58a523-29ae-4192-b64b-76999cfe40d9	Housekeeping (Hospitality Standard)	Kebersihan area klinik dengan standar industri perhotelan.	t	2026-04-09 11:30:50.092	2026-04-09 11:30:50.092	1	8e26cd44-097c-4cdc-9f9d-db9349d9c654	1	2f33c982-33d9-416b-bb9c-90602896da7d
20268f9d-842b-413b-af80-906f543206c7	Maintenance & Engineering	Pemeliharaan alat medis dan fasilitas (AC, Wi-Fi, Lift).	t	2026-04-09 11:30:50.093	2026-04-09 11:30:50.093	1	8e26cd44-097c-4cdc-9f9d-db9349d9c654	2	2f33c982-33d9-416b-bb9c-90602896da7d
e58d5b19-ac09-45fe-84af-da6ef3021195	Purchasing & Inventory	Pengadaan stok bahan medis dan non-medis berkualitas.	t	2026-04-09 11:30:50.094	2026-04-09 11:30:50.094	1	8e26cd44-097c-4cdc-9f9d-db9349d9c654	3	2f33c982-33d9-416b-bb9c-90602896da7d
94125ea8-238f-422e-b46f-aa7f25dd32af	Finance, Accounting, & Tax	Pengelolaan arus kas, pelaporan keuangan, dan perpajakan.	t	2026-04-09 11:30:50.095	2026-04-09 11:30:50.095	1	d824f730-5806-46d5-8905-f0b2c2ab43ce	1	2f33c982-33d9-416b-bb9c-90602896da7d
d152b7ff-5180-404b-b9ad-2a02b69e91be	Human Resources Development (HRD)	Rekrutmen dan pelatihan staf dengan soft skill pelayanan premium.	t	2026-04-09 11:30:50.096	2026-04-09 11:30:50.096	1	d824f730-5806-46d5-8905-f0b2c2ab43ce	2	2f33c982-33d9-416b-bb9c-90602896da7d
dbbed9b8-69c1-44f7-b85e-9b9331d58e4d	Marketing & Public Relations	Branding, social media, dan kerjasama komunitas eksklusif/asuransi.	t	2026-04-09 11:30:50.097	2026-04-09 11:30:50.097	1	d824f730-5806-46d5-8905-f0b2c2ab43ce	3	2f33c982-33d9-416b-bb9c-90602896da7d
7ec1ddfe-c4e4-46d3-a293-45a12afda192	IT Support	Pengelolaan SIM-Klinik dan keamanan data pasien.	t	2026-04-09 11:30:50.098	2026-04-09 11:30:50.098	1	d824f730-5806-46d5-8905-f0b2c2ab43ce	4	2f33c982-33d9-416b-bb9c-90602896da7d
874a7147-4ddc-4781-926e-412921aba6f9	Quality Assurance & Komite Medik	Memastikan standar SOP dan keselamatan pasien (Patient Safety).	t	2026-04-09 11:30:50.099	2026-04-09 11:30:50.099	1	6fa427ad-1196-49d6-a606-bd6c54fcdf6d	1	2f33c982-33d9-416b-bb9c-90602896da7d
f75bf3aa-5d30-4233-90c6-cb31749583d0	Layanan Home Care	Tim medis khusus untuk tindakan di rumah pasien (VIP Home Service).	t	2026-04-09 11:30:50.1	2026-04-09 11:30:50.1	1	6fa427ad-1196-49d6-a606-bd6c54fcdf6d	2	2f33c982-33d9-416b-bb9c-90602896da7d
dd976d6c-e623-4376-99cc-baba9e75cf61	Poli Spesialis	Konsultasi dokter spesialis (Estetika, Gigi, Anak, Penyakit Dalam).	t	2026-04-09 11:30:50.102	2026-04-09 11:30:50.102	1	63040adc-225b-438b-a33b-79278e9487eb	1	2f33c982-33d9-416b-bb9c-90602896da7d
98d5b4d1-d2f7-4b7e-88b9-c16328c804ab	Unit Gawat Darurat (UGD) Terbatas	Penanganan awal kegawatdaruratan sebelum rujukan.	t	2026-04-09 11:30:50.103	2026-04-09 11:30:50.103	1	63040adc-225b-438b-a33b-79278e9487eb	2	2f33c982-33d9-416b-bb9c-90602896da7d
3c88f736-e44e-46cd-b10d-3993f4ff3c36	Keperawatan (Nursing)	Staf perawat terlatih dengan standar keramahan hotel berbintang.	t	2026-04-09 11:30:50.104	2026-04-09 11:30:50.104	1	63040adc-225b-438b-a33b-79278e9487eb	3	2f33c982-33d9-416b-bb9c-90602896da7d
76ccd850-7629-4e2a-9b59-830c26a95661	Farmasi	Penyediaan obat-obatan paten dan racikan berkualitas tinggi.	t	2026-04-09 11:30:50.104	2026-04-09 11:30:50.104	1	63040adc-225b-438b-a33b-79278e9487eb	4	2f33c982-33d9-416b-bb9c-90602896da7d
\.


--
-- Data for Name: doctor_schedules; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.doctor_schedules (id, "doctorId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt", "clinicId") FROM stdin;
92704cf9-e01e-4f68-a705-e1f089161a90	e808b84b-3155-4d31-977b-b86048c29a75	Senin	08:00	12:00	t	2026-04-09 11:11:51.021	2026-04-09 11:11:51.021	cdf427a7-bf4d-478e-97e7-7f24c214f584
90bf0f86-2a1e-44e5-abbc-cc50f31b66db	e808b84b-3155-4d31-977b-b86048c29a75	Selasa	08:00	12:00	t	2026-04-09 11:11:55.892	2026-04-09 11:11:55.892	cdf427a7-bf4d-478e-97e7-7f24c214f584
dc046170-dc16-4b04-9e39-f49e9b4ac1bf	e808b84b-3155-4d31-977b-b86048c29a75	Rabu	08:00	12:00	t	2026-04-09 11:12:01.911	2026-04-09 11:12:01.911	cdf427a7-bf4d-478e-97e7-7f24c214f584
bdf7a0aa-84cc-4b58-8e51-56af98d54976	07d9169d-f641-49da-a550-5da9db6949e7	Senin	08:00	12:00	t	2026-04-09 16:07:37.423	2026-04-09 16:07:37.423	2f33c982-33d9-416b-bb9c-90602896da7d
34f62424-f1c6-49fc-b117-23d753154c85	07d9169d-f641-49da-a550-5da9db6949e7	Selasa	08:00	12:00	t	2026-04-09 16:07:43.508	2026-04-09 16:07:43.508	2f33c982-33d9-416b-bb9c-90602896da7d
7bfd5856-a1ec-4aff-9ccd-921c3bf108b2	07d9169d-f641-49da-a550-5da9db6949e7	Rabu	08:00	12:00	t	2026-04-09 16:07:50.418	2026-04-09 16:07:50.418	2f33c982-33d9-416b-bb9c-90602896da7d
c9f7f39c-ebb1-481c-a82d-009d4a2958ea	07d9169d-f641-49da-a550-5da9db6949e7	Kamis	13:00	17:00	t	2026-04-09 16:08:16.788	2026-04-09 16:08:16.788	2f33c982-33d9-416b-bb9c-90602896da7d
6a4860d9-6bec-4b8f-a81b-170745c34158	07d9169d-f641-49da-a550-5da9db6949e7	Jumat	13:00	17:00	t	2026-04-09 16:08:35.909	2026-04-09 16:08:35.909	2f33c982-33d9-416b-bb9c-90602896da7d
01be7e5e-731a-40dc-9547-fcfae34befaf	fcdc8050-3901-44a8-af58-0b010cac2b4c	Senin	08:00	12:00	t	2026-04-09 16:08:44.122	2026-04-09 16:08:44.122	2f33c982-33d9-416b-bb9c-90602896da7d
88ef938d-02bf-43bc-87e6-54156bc927f8	fcdc8050-3901-44a8-af58-0b010cac2b4c	Selasa	08:00	12:00	t	2026-04-09 16:08:49.684	2026-04-09 16:08:49.684	2f33c982-33d9-416b-bb9c-90602896da7d
c9d7e10a-8d72-4032-8944-794de734a71f	fcdc8050-3901-44a8-af58-0b010cac2b4c	Rabu	08:00	12:00	t	2026-04-09 16:09:01.3	2026-04-09 16:09:01.3	2f33c982-33d9-416b-bb9c-90602896da7d
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.doctors (id, "userId", "licenseNumber", name, email, phone, specialization, bio, "profilePicture", "yearsOfExperience", "isActive", "createdAt", "updatedAt", "departmentId", "queueCode") FROM stdin;
e808b84b-3155-4d31-977b-b86048c29a75	bdd81275-c217-4694-ba39-36153748027f	SIP/2026/001	dr. Ahmad Fauzi	dr.fauzi@clinic.com	000000000	Umum		/uploads/doctors/doctor-1775733033471.webp	\N	t	2026-04-09 11:00:02.097	2026-04-09 11:25:11.326	2261d6e9-0758-4109-884b-20c7ab1bf0d1	\N
fcdc8050-3901-44a8-af58-0b010cac2b4c	4e78ad24-f027-42e7-9d5f-0c460bc2af8f	SIP/2222/2019	Herman	herman@gmail.com	089298191999	THT		/uploads/doctors/doctor-1775735824965.webp	6	t	2026-04-09 11:57:05.04	2026-04-10 05:14:22.409	dd976d6c-e623-4376-99cc-baba9e75cf61	HR
07d9169d-f641-49da-a550-5da9db6949e7	aa0863a6-de9a-4773-9921-846d77655666	SIP/1111/2020	Rohani	rohani0807@gmail.com	081286341759	Anak		/uploads/doctors/doctor-1775733411945.webp	5	t	2026-04-09 11:16:51.996	2026-04-10 05:14:32.436	dd976d6c-e623-4376-99cc-baba9e75cf61	RH
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.expense_categories (id, "categoryName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.expenses (id, "expenseNo", "categoryId", description, amount, "expenseDate", "paymentMethod", "approvedBy", status, notes, "attachmentUrl", "createdAt", "updatedAt", "clinicId") FROM stdin;
\.


--
-- Data for Name: financial_reports; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.financial_reports (id, "reportDate", "reportType", "totalRevenue", "totalExpense", "totalProfit", "totalPatients", "totalAppointments", "createdBy", "createdAt", "updatedAt", "clinicId") FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.inventory (id, "itemCode", "medicineId", "itemName", description, category, unit, quantity, "minimumStock", "reorderQuantity", "purchasePrice", "sellingPrice", supplier, "lastPurchaseDate", "expiryDate", location, "isActive", "createdAt", "updatedAt", "clinicId") FROM stdin;
\.


--
-- Data for Name: inventory_adjustments; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.inventory_adjustments (id, "inventoryId", "adjustmentType", quantity, reason, notes, "approvedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.inventory_transactions (id, "inventoryId", "transactionType", quantity, "referenceNo", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.invoice_items (id, "invoiceId", "serviceId", description, quantity, price, discount, subtotal) FROM stdin;
16314464-affe-431d-967b-8b1f0309911e	5336b2ee-21ac-46df-bba9-73dca8f52064	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
8233a7c1-5e7f-4b97-be0b-a6abef81e91f	5336b2ee-21ac-46df-bba9-73dca8f52064	svc-019	Hormon Tiroid (TSH/fT4)	1	180000	0	180000
3866ed4a-8481-4e65-adcd-0a2444df7982	2600c54f-783e-47f5-a3a7-2983f9240efd	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
cafc8c73-2fc1-4275-974e-8e65c26e7958	aa2e6020-6a51-448b-9528-89e1bf5ecb26	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
63ee9121-d056-4591-8182-4062fe2734f7	8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
1926019e-b8c3-4c96-ab7c-7b634d4cae6b	85cf661d-7e1e-4e04-b6db-39a0f65ebac2	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
386dcf46-aa1a-4344-935e-6751f7853624	65acaf70-545f-438b-a612-19f65973765e	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
9fd51249-9eb6-4a9e-a217-9c6c2fd704a8	6d899ccb-f9fd-4020-87f7-5b2e1136a047	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
c70abd36-7e4d-4fb8-b63c-99f6a61d2109	c3ffaf26-22ad-474c-b7aa-6337f83b5917	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
775fcc1e-d53e-49cf-ac60-69b69ea78672	696a3169-0021-4088-b8ac-838a5b54bbaa	3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	Biaya Pendaftaran	1	50000	0	50000
2479f25e-cee7-4f9f-a4e4-4f678b47ab51	8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	svc-021	USG Abdomen	1	350000	0	350000
5037cf5f-edd2-4c76-9fbf-e151451b6716	8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	svc-009	Calcium Lactate (500 mg)	1	0	0	0
c53a75d9-7437-4cba-bf6d-83f3a4a379e5	8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	svc-009	Clopidogrel (75 mg)	1	0	0	0
36ffb5db-e9a3-41ab-afea-6edd972408b1	6d899ccb-f9fd-4020-87f7-5b2e1136a047	svc-001	Konsultasi Dokter Umum	1	150000	0	150000
4cf0c814-cdbb-47f7-9305-4ca683928b19	6d899ccb-f9fd-4020-87f7-5b2e1136a047	svc-009	Enervon-C (B1 50mg, B6 20mg, B12 5mcg, C 200mg)	1	0	0	0
6ff59e6e-4d53-488e-967b-8cf03624d3d4	6d899ccb-f9fd-4020-87f7-5b2e1136a047	svc-009	Sangobion (Fe 250mg + B12 + Asam Folat)	1	0	0	0
ab0dd063-aff4-4c16-bb9e-b4aba8e94cd4	85e65494-9fc4-4d51-905e-f2786aa54397	b9ef4fbc-ac70-4006-80c3-017a2f4d8f3c	Biaya Pendaftaran	1	50000	0	50000
5a5a64cf-4986-4ba9-86e0-2036e9d5bfc8	c3ffaf26-22ad-474c-b7aa-6337f83b5917	svc-003	Konsultasi Dokter Spesialis Anak	1	250000	0	250000
0ea685f3-4f90-4d55-bfec-ca9137a44108	c3ffaf26-22ad-474c-b7aa-6337f83b5917	svc-009	Enervon-C (B1 50mg, B6 20mg, B12 5mcg, C 200mg)	1	0	0	0
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.invoices (id, "invoiceNo", "appointmentId", "patientId", "invoiceDate", "dueDate", subtotal, discount, tax, total, "amountPaid", status, notes, "createdAt", "updatedAt", "clinicId") FROM stdin;
5336b2ee-21ac-46df-bba9-73dca8f52064	INV-20260409-0001	\N	93314f7c-0944-4aad-a530-1da5ec56e610	2026-04-09 16:09:29.215	\N	230000	0	0	230000	0	unpaid	\N	2026-04-09 16:09:29.217	2026-04-09 16:13:05.421	2f33c982-33d9-416b-bb9c-90602896da7d
2600c54f-783e-47f5-a3a7-2983f9240efd	INV-20260410-0001	\N	bfb77789-f809-4f93-9b10-91962620022f	2026-04-10 03:24:43.622	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 03:24:43.624	2026-04-10 03:24:43.624	2f33c982-33d9-416b-bb9c-90602896da7d
aa2e6020-6a51-448b-9528-89e1bf5ecb26	INV-20260410-0002	\N	188ce51e-d892-4b1a-b033-ccaf04962681	2026-04-10 03:26:37.023	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 03:26:37.024	2026-04-10 03:26:37.024	2f33c982-33d9-416b-bb9c-90602896da7d
85cf661d-7e1e-4e04-b6db-39a0f65ebac2	INV-20260410-0004	\N	93314f7c-0944-4aad-a530-1da5ec56e610	2026-04-10 04:37:43.082	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 04:37:43.084	2026-04-10 04:37:43.084	2f33c982-33d9-416b-bb9c-90602896da7d
65acaf70-545f-438b-a612-19f65973765e	INV-20260410-0005	\N	93314f7c-0944-4aad-a530-1da5ec56e610	2026-04-10 04:38:12.08	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 04:38:12.081	2026-04-10 04:38:12.081	2f33c982-33d9-416b-bb9c-90602896da7d
696a3169-0021-4088-b8ac-838a5b54bbaa	INV-20260410-0008	\N	be871b17-68a4-49b4-9ac6-49eb3ee0503a	2026-04-10 04:55:56.48	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 04:55:56.481	2026-04-10 04:55:56.481	2f33c982-33d9-416b-bb9c-90602896da7d
8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	INV-20260410-0003	\N	26ed906e-769c-433d-a97e-af832ead32ec	2026-04-10 03:45:25.141	\N	400000	0	0	400000	400000	paid	\N	2026-04-10 03:45:25.142	2026-04-10 05:19:54.217	2f33c982-33d9-416b-bb9c-90602896da7d
6d899ccb-f9fd-4020-87f7-5b2e1136a047	INV-20260410-0006	\N	93314f7c-0944-4aad-a530-1da5ec56e610	2026-04-10 04:46:24.886	\N	200000	0	0	200000	0	unpaid	\N	2026-04-10 04:46:24.887	2026-04-10 05:23:03.357	2f33c982-33d9-416b-bb9c-90602896da7d
85e65494-9fc4-4d51-905e-f2786aa54397	INV-20260410-0009	\N	bfb77789-f809-4f93-9b10-91962620022f	2026-04-10 05:44:01.731	\N	50000	0	0	50000	0	unpaid	\N	2026-04-10 05:44:01.733	2026-04-10 05:44:01.733	cdf427a7-bf4d-478e-97e7-7f24c214f584
c3ffaf26-22ad-474c-b7aa-6337f83b5917	INV-20260410-0007	\N	f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	2026-04-10 04:53:15.263	\N	300000	0	0	300000	300000	paid	\N	2026-04-10 04:53:15.265	2026-04-10 05:56:09.354	2f33c982-33d9-416b-bb9c-90602896da7d
\.


--
-- Data for Name: medical_record_services; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.medical_record_services (id, "medicalRecordId", "serviceId", quantity, price, notes, "createdAt") FROM stdin;
49cd7c4d-b914-4cce-972f-edb5694050f8	be0b0d89-8641-4d2e-b6ab-fa39ac16d503	svc-003	1	250000		2026-04-10 05:54:45.93
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.medical_records (id, "recordNo", "appointmentId", "patientId", "doctorId", "chiefComplaint", diagnosis, "treatmentPlan", notes, "recordDate", "createdAt", "updatedAt", "clinicId", "registrationId", "labNotes", "labResults", "consultationDraft") FROM stdin;
0ded2dc4-caec-49dc-b5ce-b4170152be44	MR-20260410-0002	\N	26ed906e-769c-433d-a97e-af832ead32ec	07d9169d-f641-49da-a550-5da9db6949e7	Cek kehamilan 	Pemeriksaan USG	Pemeriksaan USG \nHasil : \nBB Janin 2.9 Ons\nKondisi : Sehat , Ibu dan Janin Normal \numur 23 Minggu 		2026-04-10 03:46:05.095	2026-04-10 03:46:05.096	2026-04-10 05:18:51.723	2f33c982-33d9-416b-bb9c-90602896da7d	cdaf9d9a-8306-4634-a497-4a4b0de1cedb			null
0fd2a68c-38db-4b78-8fdf-f206b22e7485	MR-20260410-0004	\N	93314f7c-0944-4aad-a530-1da5ec56e610	07d9169d-f641-49da-a550-5da9db6949e7	Badan Meriang 	Kurang vitamin dan kecapean 	Pemberian Vitamin sesui resep 		2026-04-10 05:03:09.346	2026-04-10 05:03:09.348	2026-04-10 05:23:03.33	2f33c982-33d9-416b-bb9c-90602896da7d	e28dd919-9367-4c22-a4ef-068a2f390c4b			null
c4290efc-555a-459b-a2c8-766d8c454fb2	MR-20260410-0005	\N	be871b17-68a4-49b4-9ac6-49eb3ee0503a	07d9169d-f641-49da-a550-5da9db6949e7	Badan Gatal Alergi	\N	\N	\N	2026-04-10 05:29:22.459	2026-04-10 05:29:22.461	2026-04-10 05:29:22.461	2f33c982-33d9-416b-bb9c-90602896da7d	01853cfe-7cd6-41a1-ab58-364963470471	\N	\N	\N
5a8e250a-87b4-4cad-99b8-ffc4ed5e908f	MR-20260409-0001	\N	93314f7c-0944-4aad-a530-1da5ec56e610	07d9169d-f641-49da-a550-5da9db6949e7	Badan Meriang dan Lemas	Terkena Typus 	Test Lab darah, karena sudah melebihi 3 hari \nHasil Positif terkena Typus, \nRawat Jalan dan istirahat Total 		2026-04-09 16:10:20.409	2026-04-09 16:10:20.41	2026-04-09 16:13:05.411	2f33c982-33d9-416b-bb9c-90602896da7d	82918c30-1da4-4f0c-a0ba-7fe81256adb7			\N
aa6ded5f-3e0e-4b40-adf3-229fe4594087	MR-20260410-0001	\N	bfb77789-f809-4f93-9b10-91962620022f	e808b84b-3155-4d31-977b-b86048c29a75	Kepala sering Pusing parah, Sudah lebih dari 1 Minggu, serta pendengaran makin berkurang 	\N	\N	\N	2026-04-10 03:34:53.089	2026-04-10 03:34:53.09	2026-04-10 03:34:53.09	2f33c982-33d9-416b-bb9c-90602896da7d	a7c8f0fe-46ad-4a0a-a4ff-4ba17a6a6915	\N	\N	\N
44af6daa-ec5b-494b-93b9-43a92d6696ef	MR-20260410-0006	\N	188ce51e-d892-4b1a-b033-ccaf04962681	fcdc8050-3901-44a8-af58-0b010cac2b4c	Sakit Pinggang 	\N	\N	\N	2026-04-10 05:31:59.139	2026-04-10 05:31:59.141	2026-04-10 05:31:59.141	2f33c982-33d9-416b-bb9c-90602896da7d	f39d3e18-a351-42cd-9a68-471a3f5c2b60	\N	\N	\N
9b5da1bc-3f3d-43f9-9d96-943929dfd4ec	MR-20260410-0007	\N	bfb77789-f809-4f93-9b10-91962620022f	e808b84b-3155-4d31-977b-b86048c29a75	Sakit Perut 	\N	\N	\N	2026-04-10 05:44:43.275	2026-04-10 05:44:43.276	2026-04-10 05:44:43.276	cdf427a7-bf4d-478e-97e7-7f24c214f584	9ba51307-dd18-4293-bf16-bf3f68f7c480	\N	\N	\N
be0b0d89-8641-4d2e-b6ab-fa39ac16d503	MR-20260410-0003	\N	f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	07d9169d-f641-49da-a550-5da9db6949e7	Demam	Radang tenggorokan karena cuaca	Pemberian Vitamin dan Istrahat 		2026-04-10 04:57:49.76	2026-04-10 04:57:49.762	2026-04-10 05:54:45.92	2f33c982-33d9-416b-bb9c-90602896da7d	70448748-54e9-40b1-ba07-1120f975cc40			\N
\.


--
-- Data for Name: medicines; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.medicines (id, "medicineName", "genericName", description, "dosageForm", strength, manufacturer, "batchNumber", "expiryDate", "isActive", "createdAt", "updatedAt", image, "clinicId", "medicineCode") FROM stdin;
m1	Sanmol	Paracetamol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	Tablet	500 mg	Sanbe	SAN2401A	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m2	Bodrex	Paracetamol + Pseudoefedrin HCl	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	Tablet	500 mg + 30 mg	Kimia Farma	KF2402B	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m3	Farnox	Ibuprofen	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	Tablet	400 mg	Novell Pharma	NOV2403C	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m4	Ponalac	Naproxen	Nyeri rematik, asam urat, dan nyeri haid	Tablet	250 mg	Soho	SOH2404D	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m5	Amoxan	Amoxicillin	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	Capsule	500 mg	Kimia Farma	KF2405E	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m6	Ciflos	Ciprofloxacin	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	Tablet	500 mg	Hexpharm	HEX2406F	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m7	Kalmethrox	Azithromycin	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	Tablet	500 mg	Kalbe Farma	KAL2407G	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m8	Promag	Aluminium Magnesium Hydroxide + Simethicone	Mengatasi maag, perut kembung, dan nyeri lambung	Tablet	400 mg/5ml	Darya Varia	DVA2408H	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m9	Bio Gastra	Ranitidine HCl	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	Tablet	150 mg	Bernofarm	BER2409I	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m10	Lasal	Salbutamol sulfate	Bronkodilator untuk asma dan sesak napas	Tablet	2 mg	Hexpharm	HEX2410J	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m11	OBH Combi	Guaifenesin + Dextromethorphan HBr	Meredakan batuk berdahak dan batuk kering	Syrup	100 mg/5ml + 15 mg/5ml	Prafa	PRA2411K	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m12	Woods	Guaifenesin	Mengencerkan dahak pada batuk berdahak	Syrup	100 mg/5ml	Kimia Farma	KF2412L	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m13	Antimo	Dimenhydrinate	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	Tablet	50 mg	Bintang Toedjoe	BIT2413M	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m14	Cetirizine	Cetirizine HCl	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	Tablet	10 mg	Dexa Medica	DEM2414N	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m15	Lorastine	Loratadine	Antihistamin non-sedatif untuk alergi kronis	Tablet	10 mg	Hexpharm	HEX2415O	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m16	CTM	Chlorpheniramine Maleate	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	Tablet	4 mg	Konimex	KON2416P	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m17	Dextamine	Dexamethasone	Kortikosteroid untuk peradangan berat dan alergi berat	Tablet	0.5 mg	Mutiara	MUT2417Q	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m18	Glucolin	Glucose	Sumber energi cepat untuk pasien lemas atau dehidrasi	Syrup	200 mg/5ml	Sanbe	SAN2418R	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m19	Enervon-C	Vitamin B Complex + Vitamin C	Multivitamin untuk daya tahan tubuh dan pemulihan	Tablet	B1 50mg, B6 20mg, B12 5mcg, C 200mg	Dexa Medica	DEM2419S	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m20	Sangobion	Iron + Vitamin Complex	Mengatasi anemia (kekurangan darah)	Capsule	Fe 250mg + B12 + Asam Folat	PT. Sangobion	SAN2420T	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m21	Diapet	Attapulgite + Diosmectite	Mengatasi diare akut dan kronis	Tablet	750 mg	Kimia Farma	KF2421U	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m22	New Diatabs	Loperamide HCl	Menghentikan diare akut dengan mengurangi pergerakan usus	Capsule	2 mg	Novell Pharma	NOV2422V	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m23	Bisolvon	Bromhexine HCl	Mengencerkan dahak pada batuk berdahak	Tablet	8 mg	Boehringer	BOH2423W	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m24	Flutamol	Fluoxetine HCl	Antidepresan untuk depresi, OCD, dan bulimia	Capsule	20 mg	Kimia Farma	KF2424X	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m25	Calcium Lactate	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	Tablet	500 mg	Hexpharm	HEX2425Y	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m26	Betadine	Povidone-Iodine	Antiseptik untuk luka dan persiapan operasi	Solution (Topical)	10%	PT. Betadine	BET2426Z	2027-01-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m27	Kalpanax	Diazepam	Obat penenang untuk kecemasan berat dan relaksasi otot	Tablet	2 mg	Kalbe Farma	KAL2427A	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m28	Nifedipine	Nifedipine	Antihipertensi untuk tekanan darah tinggi	Capsule	10 mg	Kimia Farma	KF2428B	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m29	Captopril	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	Tablet	25 mg	Hexpharm	HEX2429C	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m30	Glibenclamide	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	Tablet	5 mg	Sanbe	SAN2430D	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m31	Metformin	Metformin HCl	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	Tablet	500 mg	Dexa Medica	DEM2431E	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m32	Simvastatin	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	Tablet	10 mg	Kimia Farma	KF2432F	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m33	Allopurinol	Allopurinol	Mencegah serangan asam urat (gout)	Tablet	100 mg	Hexpharm	HEX2433G	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m34	Omeprazole	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	Capsule	20 mg	Kalbe Farma	KAL2434H	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m35	Domperidone	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	Tablet	10 mg	Novell Pharma	NOV2435I	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m36	Mebendazole	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	Tablet	100 mg	Kimia Farma	KF2436J	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m37	Albendazole	Albendazole	Antelmintik spektrum luas untuk cacingan	Tablet	400 mg	Sanbe	SAN2437K	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m38	Methylprednisolone	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	Tablet	4 mg	Dexa Medica	DEM2438L	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m39	Warfarin	Warfarin Sodium	Antikoagulan untuk mencegah pembekuan darah	Tablet	2 mg	Kimia Farma	KF2439M	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m40	Digoxin	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	Tablet	0.25 mg	Hexpharm	HEX2440N	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m41	Furosemide	Furosemide	Diuretik kuat untuk edema dan hipertensi	Tablet	40 mg	Sanbe	SAN2441O	2026-07-30 17:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m42	Spironolactone	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	Tablet	25 mg	Kalbe Farma	KAL2442P	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m43	Levothyroxine	Levothyroxine Sodium	Hormon tiroid untuk hipotiroidisme	Tablet	50 mcg	Kimia Farma	KF2443Q	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m44	Clopidogrel	Clopidogrel Bisulfate	Antiplatelet untuk mencegah stroke dan serangan jantung	Tablet	75 mg	Dexa Medica	DEM2444R	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m45	Amlodipine	Amlodipine Besylate	Antihipertensi golongan CCB untuk hipertensi	Tablet	5 mg	Hexpharm	HEX2445S	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m46	Losartan	Losartan Potassium	Antihipertensi golongan ARB untuk hipertensi	Tablet	50 mg	Novell Pharma	NOV2446T	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m47	Bisoprolol	Bisoprolol Fumarate	Beta-blocker untuk hipertensi dan gagal jantung	Tablet	5 mg	Kalbe Farma	KAL2447U	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m48	Insulin NPH	Insulin Isophane	Insulin kerja menengah untuk diabetes melitus	Injection	100 IU/ml	Eli Lilly	ELL2448V	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m49	Epinephrine	Epinephrine	Untuk syok anafilaksis dan henti jantung	Injection	1 mg/ml	Kimia Farma	KF2449W	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m50	Atropine Sulfate	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	Injection	0.5 mg/ml	Hexpharm	HEX2450X	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m51	Ceftriaxone	Ceftriaxone Sodium	Antibiotik suntik spektrum luas untuk infeksi berat	Injection	1 g/vial	Sanbe	SAN2451Y	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m52	Gentamicin	Gentamicin Sulfate	Antibiotik aminoglikosida untuk infeksi gram negatif	Injection	80 mg/2ml	Kimia Farma	KF2452Z	2026-09-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m53	Ketorolac	Ketorolac Tromethamine	Analgesik kuat untuk nyeri sedang-berat pasca operasi	Injection	30 mg/ml	Dexa Medica	DEM2453A	2026-07-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m54	Ondansetron	Ondansetron HCl	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	Injection	4 mg/2ml	Novell Pharma	NOV2454B	2026-11-30 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m55	Dexamethasone	Dexamethasone Sodium Phosphate	Kortikosteroid untuk inflamasi dan alergi berat	Injection	5 mg/ml	Hexpharm	HEX2455C	2026-10-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m56	Paracetamol Infus	Paracetamol	Antipiretik untuk demam tinggi pada pasien rawat inap	Injection	10 mg/ml	Kimia Farma	KF2456D	2026-08-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m57	Ringers Lactate	Ringers Lactate Solution	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	Liquid	500 ml	Oxoid	OXY2457E	2027-02-28 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m58	NaCl 0.9%	Sodium Chloride	Cairan infus isotonik untuk dehidrasi	Liquid	500 ml	Kimia Farma	KF2458F	2027-01-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m59	Dextrose 5%	Dextrose Monohydrate	Sumber energi untuk pasien lemas atau hipoglikemia	Liquid	500 ml	Hexpharm	HEX2459G	2027-03-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
m60	Hydrocortisone Cream	Hydrocortisone Acetate	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	Cream (Topical)	1%	Dexa Medica	DEM2460H	2026-12-31 00:00:00	t	2026-04-08 00:00:00	2026-04-10 02:21:35.725	\N	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
3da3169a-d958-4783-8803-3ab23d7056c2	Sanmol	Paracetamol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	Tablet	500 mg	Sanbe	SAN2401A	2026-12-31 00:00:00	t	2026-04-10 02:25:51.318	2026-04-10 02:25:51.318	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
8cc31768-1312-4e52-8abc-7230922f3a89	Bodrex	Paracetamol + Pseudoefedrin HCl	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	Tablet	500 mg + 30 mg	Kimia Farma	KF2402B	2026-10-31 00:00:00	t	2026-04-10 02:25:51.343	2026-04-10 02:25:51.343	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
f01c6bad-63ce-4a67-9953-da18d28ea8a4	Farnox	Ibuprofen	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	Tablet	400 mg	Novell Pharma	NOV2403C	2026-09-30 00:00:00	t	2026-04-10 02:25:51.349	2026-04-10 02:25:51.349	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
2ac557a9-ada8-433d-974c-df86dcf549d7	Ponalac	Naproxen	Nyeri rematik, asam urat, dan nyeri haid	Tablet	250 mg	Soho	SOH2404D	2026-11-30 00:00:00	t	2026-04-10 02:25:51.355	2026-04-10 02:25:51.355	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
485b2859-44a5-4296-a445-3b65eebde2d8	Ciflos	Ciprofloxacin	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	Tablet	500 mg	Hexpharm	HEX2406F	2026-07-31 00:00:00	t	2026-04-10 02:25:51.366	2026-04-10 02:25:51.366	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
946285d8-373c-4bce-ac36-398c0e59fc2a	Kalmethrox	Azithromycin	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	Tablet	500 mg	Kalbe Farma	KAL2407G	2026-12-31 00:00:00	t	2026-04-10 02:25:51.371	2026-04-10 02:25:51.371	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
7f049d2f-7dca-4bf9-b7b1-3ab44e2fc8c0	Promag	Aluminium Magnesium Hydroxide + Simethicone	Mengatasi maag, perut kembung, dan nyeri lambung	Tablet	400 mg/5ml	Darya Varia	DVA2408H	2026-09-30 00:00:00	t	2026-04-10 02:25:51.375	2026-04-10 02:25:51.375	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
35b7c5e0-236a-40af-a1d0-ccc535475d25	Bio Gastra	Ranitidine HCl	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	Tablet	150 mg	Bernofarm	BER2409I	2026-10-31 00:00:00	t	2026-04-10 02:25:51.378	2026-04-10 02:25:51.378	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
8957083b-3fad-4658-83ca-788dcf694ad6	Lasal	Salbutamol sulfate	Bronkodilator untuk asma dan sesak napas	Tablet	2 mg	Hexpharm	HEX2410J	2026-08-31 00:00:00	t	2026-04-10 02:25:51.384	2026-04-10 02:25:51.384	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
985756b1-a288-4ec5-9c18-0eccb449e783	OBH Combi	Guaifenesin + Dextromethorphan HBr	Meredakan batuk berdahak dan batuk kering	Syrup	100 mg/5ml + 15 mg/5ml	Prafa	PRA2411K	2026-09-30 00:00:00	t	2026-04-10 02:25:51.387	2026-04-10 02:25:51.387	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
c1fd0954-97d6-4014-84d4-2663e7307600	Woods	Guaifenesin	Mengencerkan dahak pada batuk berdahak	Syrup	100 mg/5ml	Kimia Farma	KF2412L	2026-11-30 00:00:00	t	2026-04-10 02:25:51.391	2026-04-10 02:25:51.391	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
f471d6e0-2797-452d-a7ea-5a3623893064	Antimo	Dimenhydrinate	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	Tablet	50 mg	Bintang Toedjoe	BIT2413M	2026-10-31 00:00:00	t	2026-04-10 02:25:51.395	2026-04-10 02:25:51.395	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
f9d9d7fa-de64-4424-8a64-f922c1728518	Cetirizine	Cetirizine HCl	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	Tablet	10 mg	Dexa Medica	DEM2414N	2026-12-31 00:00:00	t	2026-04-10 02:25:51.401	2026-04-10 02:25:51.401	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
ca27fdde-1673-4633-831d-78b80dc406ab	Lorastine	Loratadine	Antihistamin non-sedatif untuk alergi kronis	Tablet	10 mg	Hexpharm	HEX2415O	2026-09-30 00:00:00	t	2026-04-10 02:25:51.405	2026-04-10 02:25:51.405	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
94c272e6-5faf-4566-b21b-4daafc705b38	CTM	Chlorpheniramine Maleate	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	Tablet	4 mg	Konimex	KON2416P	2026-08-31 00:00:00	t	2026-04-10 02:25:51.409	2026-04-10 02:25:51.409	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
f0552ea5-1152-4c69-85bd-8208a534b1e4	Dextamine	Dexamethasone	Kortikosteroid untuk peradangan berat dan alergi berat	Tablet	0.5 mg	Mutiara	MUT2417Q	2026-07-31 00:00:00	t	2026-04-10 02:25:51.412	2026-04-10 02:25:51.412	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
f9456bdc-21a2-4ced-9fc5-ff9a7b8cddf0	Glucolin	Glucose	Sumber energi cepat untuk pasien lemas atau dehidrasi	Syrup	200 mg/5ml	Sanbe	SAN2418R	2026-12-31 00:00:00	t	2026-04-10 02:25:51.417	2026-04-10 02:25:51.417	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
7f479fe8-a087-4ba4-959d-45e31594bcc9	Enervon-C	Vitamin B Complex + Vitamin C	Multivitamin untuk daya tahan tubuh dan pemulihan	Tablet	B1 50mg, B6 20mg, B12 5mcg, C 200mg	Dexa Medica	DEM2419S	2026-11-30 00:00:00	t	2026-04-10 02:25:51.421	2026-04-10 02:25:51.421	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
dd10f39a-77c8-4bc3-854c-d5e2eb80c21b	Sangobion	Iron + Vitamin Complex	Mengatasi anemia (kekurangan darah)	Capsule	Fe 250mg + B12 + Asam Folat	PT. Sangobion	SAN2420T	2026-10-31 00:00:00	t	2026-04-10 02:25:51.424	2026-04-10 02:25:51.424	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
a22facf2-8dca-4a59-af33-a66adf03b53b	Diapet	Attapulgite + Diosmectite	Mengatasi diare akut dan kronis	Tablet	750 mg	Kimia Farma	KF2421U	2026-09-30 00:00:00	t	2026-04-10 02:25:51.427	2026-04-10 02:25:51.427	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
62d13715-4611-4f53-8e56-63abbd1a9e17	New Diatabs	Loperamide HCl	Menghentikan diare akut dengan mengurangi pergerakan usus	Capsule	2 mg	Novell Pharma	NOV2422V	2026-08-31 00:00:00	t	2026-04-10 02:25:51.43	2026-04-10 02:25:51.43	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
8cc11d77-b47d-43b2-ab8b-a54e18dbcf2e	Bisolvon	Bromhexine HCl	Mengencerkan dahak pada batuk berdahak	Tablet	8 mg	Boehringer	BOH2423W	2026-12-31 00:00:00	t	2026-04-10 02:25:51.435	2026-04-10 02:25:51.435	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
e3f8eb44-1775-41e6-a337-0a01885e98ab	Flutamol	Fluoxetine HCl	Antidepresan untuk depresi, OCD, dan bulimia	Capsule	20 mg	Kimia Farma	KF2424X	2026-07-31 00:00:00	t	2026-04-10 02:25:51.438	2026-04-10 02:25:51.438	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
968d1d26-ab39-4ded-b98b-e6505a1d8fe8	Calcium Lactate	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	Tablet	500 mg	Hexpharm	HEX2425Y	2026-11-30 00:00:00	t	2026-04-10 02:25:51.441	2026-04-10 02:25:51.441	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
1e443a27-e3f3-4606-bec5-0f9d0e6de613	Betadine	Povidone-Iodine	Antiseptik untuk luka dan persiapan operasi	Solution (Topical)	10%	PT. Betadine	BET2426Z	2027-01-31 00:00:00	t	2026-04-10 02:25:51.444	2026-04-10 02:25:51.444	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
30bbcbe7-dc2c-4c7e-963d-ea69649d4e9c	Kalpanax	Diazepam	Obat penenang untuk kecemasan berat dan relaksasi otot	Tablet	2 mg	Kalbe Farma	KAL2427A	2026-09-30 00:00:00	t	2026-04-10 02:25:51.448	2026-04-10 02:25:51.448	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
283a3caf-d377-4118-8bec-2978626531ee	Nifedipine	Nifedipine	Antihipertensi untuk tekanan darah tinggi	Capsule	10 mg	Kimia Farma	KF2428B	2026-10-31 00:00:00	t	2026-04-10 02:25:51.452	2026-04-10 02:25:51.452	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
cf31bf43-cad7-4b22-b89b-ad98ce0dfc6c	Captopril	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	Tablet	25 mg	Hexpharm	HEX2429C	2026-08-31 00:00:00	t	2026-04-10 02:25:51.457	2026-04-10 02:25:51.457	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
9917b97d-9474-4755-ac51-02691fdbb3b4	Glibenclamide	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	Tablet	5 mg	Sanbe	SAN2430D	2026-12-31 00:00:00	t	2026-04-10 02:25:51.46	2026-04-10 02:25:51.46	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
68b43f8a-8585-4831-9a2d-e5d09e81c628	Metformin	Metformin HCl	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	Tablet	500 mg	Dexa Medica	DEM2431E	2026-11-30 00:00:00	t	2026-04-10 02:25:51.463	2026-04-10 02:25:51.463	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
55fa8d9d-0f52-45e0-b1c7-b04ce54ff631	Simvastatin	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	Tablet	10 mg	Kimia Farma	KF2432F	2026-09-30 00:00:00	t	2026-04-10 02:25:51.468	2026-04-10 02:25:51.468	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
8c658c25-ba08-431b-8d79-6858c70bddd1	Allopurinol	Allopurinol	Mencegah serangan asam urat (gout)	Tablet	100 mg	Hexpharm	HEX2433G	2026-10-31 00:00:00	t	2026-04-10 02:25:51.471	2026-04-10 02:25:51.471	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
e821278e-a3eb-4185-b0b3-8fdd6660c6c4	Omeprazole	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	Capsule	20 mg	Kalbe Farma	KAL2434H	2026-12-31 00:00:00	t	2026-04-10 02:25:51.474	2026-04-10 02:25:51.474	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
ba12557f-e844-476c-92ca-d5df8bba6c46	Domperidone	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	Tablet	10 mg	Novell Pharma	NOV2435I	2026-07-31 00:00:00	t	2026-04-10 02:25:51.477	2026-04-10 02:25:51.477	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
0e48ad16-2d77-496e-9656-e5e461c2cf87	Mebendazole	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	Tablet	100 mg	Kimia Farma	KF2436J	2026-11-30 00:00:00	t	2026-04-10 02:25:51.481	2026-04-10 02:25:51.481	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
c83432ce-7d78-4444-bf2f-2e8df26d1229	Albendazole	Albendazole	Antelmintik spektrum luas untuk cacingan	Tablet	400 mg	Sanbe	SAN2437K	2026-08-31 00:00:00	t	2026-04-10 02:25:51.485	2026-04-10 02:25:51.485	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
7574e35f-2db6-405d-a58b-4c512f12271e	Methylprednisolone	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	Tablet	4 mg	Dexa Medica	DEM2438L	2026-10-31 00:00:00	t	2026-04-10 02:25:51.489	2026-04-10 02:25:51.489	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
2c33982e-85ab-41bd-bdbc-0479dba5d1c6	Warfarin	Warfarin Sodium	Antikoagulan untuk mencegah pembekuan darah	Tablet	2 mg	Kimia Farma	KF2439M	2026-09-30 00:00:00	t	2026-04-10 02:25:51.492	2026-04-10 02:25:51.492	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
1e6c2322-93c9-45df-a7b5-d4889968cb28	Digoxin	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	Tablet	0.25 mg	Hexpharm	HEX2440N	2026-12-31 00:00:00	t	2026-04-10 02:25:51.495	2026-04-10 02:25:51.495	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
8cf174f0-17b0-4860-8656-931f2aff9b15	Furosemide	Furosemide	Diuretik kuat untuk edema dan hipertensi	Tablet	40 mg	Sanbe	SAN2441O	2026-07-30 17:00:00	t	2026-04-10 02:25:51.499	2026-04-10 02:25:51.499	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
d6cbe71b-2946-44c4-b104-08bbe6fe7473	Spironolactone	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	Tablet	25 mg	Kalbe Farma	KAL2442P	2026-11-30 00:00:00	t	2026-04-10 02:25:51.504	2026-04-10 02:25:51.504	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
e9fbd434-f960-4b86-8f41-a6c33b99d28c	Levothyroxine	Levothyroxine Sodium	Hormon tiroid untuk hipotiroidisme	Tablet	50 mcg	Kimia Farma	KF2443Q	2026-08-31 00:00:00	t	2026-04-10 02:25:51.508	2026-04-10 02:25:51.508	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
48625807-83e4-43f6-adfe-8886b1293e3d	Clopidogrel	Clopidogrel Bisulfate	Antiplatelet untuk mencegah stroke dan serangan jantung	Tablet	75 mg	Dexa Medica	DEM2444R	2026-10-31 00:00:00	t	2026-04-10 02:25:51.511	2026-04-10 02:25:51.511	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
3722d7be-9cf0-4c71-9ca2-48f6bb520fa2	Amlodipine	Amlodipine Besylate	Antihipertensi golongan CCB untuk hipertensi	Tablet	5 mg	Hexpharm	HEX2445S	2026-12-31 00:00:00	t	2026-04-10 02:25:51.514	2026-04-10 02:25:51.514	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
192fb77c-9db0-4997-bfec-7830528eec84	Losartan	Losartan Potassium	Antihipertensi golongan ARB untuk hipertensi	Tablet	50 mg	Novell Pharma	NOV2446T	2026-09-30 00:00:00	t	2026-04-10 02:25:51.519	2026-04-10 02:25:51.519	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
b01221e8-bb16-47eb-8a3d-8941f42fe10a	Bisoprolol	Bisoprolol Fumarate	Beta-blocker untuk hipertensi dan gagal jantung	Tablet	5 mg	Kalbe Farma	KAL2447U	2026-07-31 00:00:00	t	2026-04-10 02:25:51.522	2026-04-10 02:25:51.522	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
7679d460-d0b8-4aab-a351-df487b2d63b1	Insulin NPH	Insulin Isophane	Insulin kerja menengah untuk diabetes melitus	Injection	100 IU/ml	Eli Lilly	ELL2448V	2026-11-30 00:00:00	t	2026-04-10 02:25:51.526	2026-04-10 02:25:51.526	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
12588182-c527-46f6-b1bc-196ddbeb76cb	Epinephrine	Epinephrine	Untuk syok anafilaksis dan henti jantung	Injection	1 mg/ml	Kimia Farma	KF2449W	2026-10-31 00:00:00	t	2026-04-10 02:25:51.529	2026-04-10 02:25:51.529	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
683adbfb-d782-4268-a96f-3e686328a37e	Atropine Sulfate	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	Injection	0.5 mg/ml	Hexpharm	HEX2450X	2026-08-31 00:00:00	t	2026-04-10 02:25:51.532	2026-04-10 02:25:51.532	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
4b4af086-5654-4398-9f65-64ad16e46b2a	Ceftriaxone	Ceftriaxone Sodium	Antibiotik suntik spektrum luas untuk infeksi berat	Injection	1 g/vial	Sanbe	SAN2451Y	2026-12-31 00:00:00	t	2026-04-10 02:25:51.536	2026-04-10 02:25:51.536	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
97676799-1da5-4c87-9aed-7535920d3fa2	Gentamicin	Gentamicin Sulfate	Antibiotik aminoglikosida untuk infeksi gram negatif	Injection	80 mg/2ml	Kimia Farma	KF2452Z	2026-09-30 00:00:00	t	2026-04-10 02:25:51.539	2026-04-10 02:25:51.539	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
cbab7e18-111b-49d7-a70e-386629462563	Ketorolac	Ketorolac Tromethamine	Analgesik kuat untuk nyeri sedang-berat pasca operasi	Injection	30 mg/ml	Dexa Medica	DEM2453A	2026-07-31 00:00:00	t	2026-04-10 02:25:51.542	2026-04-10 02:25:51.542	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
ad465ef3-f81a-419c-b10c-25e6a9d3b6a2	Ondansetron	Ondansetron HCl	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	Injection	4 mg/2ml	Novell Pharma	NOV2454B	2026-11-30 00:00:00	t	2026-04-10 02:25:51.545	2026-04-10 02:25:51.545	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
d91f883f-10b7-4cd5-9bd3-5ed19547850b	Dexamethasone	Dexamethasone Sodium Phosphate	Kortikosteroid untuk inflamasi dan alergi berat	Injection	5 mg/ml	Hexpharm	HEX2455C	2026-10-31 00:00:00	t	2026-04-10 02:25:51.549	2026-04-10 02:25:51.549	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
70073f85-ccdd-4445-bba7-a56a464b8c4f	Paracetamol Infus	Paracetamol	Antipiretik untuk demam tinggi pada pasien rawat inap	Injection	10 mg/ml	Kimia Farma	KF2456D	2026-08-31 00:00:00	t	2026-04-10 02:25:51.553	2026-04-10 02:25:51.553	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
45218e67-4935-4e7c-8104-85647fb42789	Ringers Lactate	Ringers Lactate Solution	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	Liquid	500 ml	Oxoid	OXY2457E	2027-02-28 00:00:00	t	2026-04-10 02:25:51.556	2026-04-10 02:25:51.556	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
19b31abf-2df3-4064-a31c-3cf64d691273	NaCl 0.9%	Sodium Chloride	Cairan infus isotonik untuk dehidrasi	Liquid	500 ml	Kimia Farma	KF2458F	2027-01-31 00:00:00	t	2026-04-10 02:25:51.559	2026-04-10 02:25:51.559	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
edf53394-1e72-46f1-80a9-8d17c0ce2253	Dextrose 5%	Dextrose Monohydrate	Sumber energi untuk pasien lemas atau hipoglikemia	Liquid	500 ml	Hexpharm	HEX2459G	2027-03-31 00:00:00	t	2026-04-10 02:25:51.563	2026-04-10 02:25:51.563	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
def80307-5339-4f31-a3ad-043b24b961fc	Hydrocortisone Cream	Hydrocortisone Acetate	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	Cream (Topical)	1%	Dexa Medica	DEM2460H	2026-12-31 00:00:00	t	2026-04-10 02:25:51.566	2026-04-10 02:25:51.566	\N	2f33c982-33d9-416b-bb9c-90602896da7d	\N
08698dfa-0bbc-4acf-a964-81e9d34b0d91	Amoxan	Amoxicillin	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	Capsule	500 mg	Kimia Farma	KF2405E	2026-08-31 00:00:00	t	2026-04-10 02:25:51.36	2026-04-10 03:13:53.824	/uploads/medicines/medicine-1775790833780.webp	2f33c982-33d9-416b-bb9c-90602896da7d	\N
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.patients (id, "medicalRecordNo", name, email, phone, address, city, province, "zipCode", "dateOfBirth", gender, "bloodType", "identityType", "identityNumber", "emergencyContact", "emergencyPhone", allergies, "isActive", "createdAt", "updatedAt", "bpjsNumber", "insuranceName") FROM stdin;
93314f7c-0944-4aad-a530-1da5ec56e610	RM-1630	Budi Santoso	\N	08123456789	Jl. Melati No. 12	\N	\N	\N	1990-05-15 00:00:00	M	O	\N	\N	\N	\N	\N	t	2026-04-09 11:00:17.623	2026-04-09 11:00:17.623	\N	\N
26ed906e-769c-433d-a97e-af832ead32ec	RM-7532	Siti Aminah	\N	08987654321	Jl. Mawar No. 45	\N	\N	\N	1985-11-20 00:00:00	F	A	\N	\N	\N	\N	\N	t	2026-04-09 11:00:17.628	2026-04-09 11:00:17.628	\N	\N
bfb77789-f809-4f93-9b10-91962620022f	RM-20260410-0001	WAGIMAN		081280212068	Bekasi				1972-10-10 00:00:00	M	A	KTP					t	2026-04-10 03:24:33.921	2026-04-10 03:24:33.921		
188ce51e-d892-4b1a-b033-ccaf04962681	RM-20260410-0002	SANDIYEM WIRODIKROMO PONIMAN	heru@astra-honda.co.id	802992989	Jakarta Selatan				0168-05-08 00:00:00	F	A	KTP					t	2026-04-10 03:26:27.564	2026-04-10 03:26:27.564		
f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	RM-20260410-0003	Orlin Lalomista	parwanto0807@gmail.com	081280212068	PERUM METLAND CIBITUNG BLOK S1/29				2016-10-10 00:00:00	F	A	KTP					t	2026-04-10 04:53:04.768	2026-04-10 04:53:04.768		
be871b17-68a4-49b4-9ac6-49eb3ee0503a	RM-20260410-0004	SUPRIYANTO	admin-user@solusiit.id	089298191999	Jababekas Cikarang U8D				1982-10-10 00:00:00	M	A	KTP					t	2026-04-10 04:55:42.952	2026-04-10 04:55:42.952		
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.payments (id, "paymentNo", "invoiceId", "paymentDate", amount, "paymentMethod", "transactionRef", notes, "createdAt", "updatedAt") FROM stdin;
2bcd4b35-8d3c-4697-ad77-36c05a789fde	PAY-394211-001	8e16e08c-8dfa-4c59-b3d2-33209d0cc10f	2026-04-10 05:19:54.211	400000	cash	\N		2026-04-10 05:19:54.213	2026-04-10 05:19:54.213
fafd413d-f771-484e-8cb8-14cb764f9971	PAY-569343-002	c3ffaf26-22ad-474c-b7aa-6337f83b5917	2026-04-10 05:56:09.343	300000	cash	\N		2026-04-10 05:56:09.345	2026-04-10 05:56:09.345
\.


--
-- Data for Name: prescription_items; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.prescription_items (id, "prescriptionId", "medicineId", quantity, dosage, frequency, duration, instructions) FROM stdin;
42c791ae-209a-4f86-a368-08c940f9b55f	751aaf1b-961a-4746-9fc4-9e2ab9645964	968d1d26-ab39-4ded-b98b-e6505a1d8fe8	1	500 mg	3x1	5 hari	Sesudah makan
041cbe71-c2f7-4f2f-a093-60645d3440d3	751aaf1b-961a-4746-9fc4-9e2ab9645964	48625807-83e4-43f6-adfe-8886b1293e3d	1	75 mg	2x1	5 hari	Sesudah makan
46ed2d84-6ce0-4ef5-95a4-26101c006030	0aa213b2-21f7-4a3a-a819-58cc2c6ff550	7f479fe8-a087-4ba4-959d-45e31594bcc9	1	B1 50mg, B6 20mg, B12 5mcg, C 200mg	3x1	5 hari	Sesudah makan
8530ce04-6e97-434e-bc29-4f0acdcd9b05	0aa213b2-21f7-4a3a-a819-58cc2c6ff550	dd10f39a-77c8-4bc3-854c-d5e2eb80c21b	1	Fe 250mg + B12 + Asam Folat	1x1	5 hari	Sesudah makan
1fd2d71f-627e-4d7c-a4f5-edaa03d3d737	bf019abf-19a6-4841-b32c-ef0cce1e77b3	7f479fe8-a087-4ba4-959d-45e31594bcc9	1	B1 50mg, B6 20mg, B12 5mcg, C 200mg	3x1	5 hari	Sesudah makan
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.prescriptions (id, "prescriptionNo", "medicalRecordId", "patientId", "doctorId", "prescriptionDate", notes, "createdAt", "updatedAt") FROM stdin;
751aaf1b-961a-4746-9fc4-9e2ab9645964	RX-331732-001	0ded2dc4-caec-49dc-b5ce-b4170152be44	26ed906e-769c-433d-a97e-af832ead32ec	07d9169d-f641-49da-a550-5da9db6949e7	2026-04-10 05:18:51.732	\N	2026-04-10 05:18:51.733	2026-04-10 05:18:51.733
0aa213b2-21f7-4a3a-a819-58cc2c6ff550	RX-583332-002	0fd2a68c-38db-4b78-8fdf-f206b22e7485	93314f7c-0944-4aad-a530-1da5ec56e610	07d9169d-f641-49da-a550-5da9db6949e7	2026-04-10 05:23:03.332	\N	2026-04-10 05:23:03.333	2026-04-10 05:23:03.333
bf019abf-19a6-4841-b32c-ef0cce1e77b3	RX-485935-003	be0b0d89-8641-4d2e-b6ab-fa39ac16d503	f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	07d9169d-f641-49da-a550-5da9db6949e7	2026-04-10 05:54:45.935	\N	2026-04-10 05:54:45.937	2026-04-10 05:54:45.937
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.product_categories (id, "categoryName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
969a8bb2-572e-44d2-b4c5-283ee339d3ba	Medicine	Kategori obat-obatan	t	2026-04-09 10:52:46.881	2026-04-09 10:52:46.881
3e4f08c3-7449-4ee0-82de-a92ff0f0ce98	IT Infrastructure	Auto-generated from Asset migration	t	2026-04-09 11:02:11.169	2026-04-09 11:02:11.169
2dd458fa-d34b-4e0f-b079-f0130de9ebce	Networking	Auto-generated from Asset migration	t	2026-04-09 11:02:26.596	2026-04-09 11:02:26.596
d1d2970d-04fb-4f11-b191-9743956cff39	Mobile Workstation	Auto-generated from Asset migration	t	2026-04-09 11:02:26.605	2026-04-09 11:02:26.605
da3ce8fc-b55d-4084-9686-472d8a2d5102	Workstation	Auto-generated from Asset migration	t	2026-04-09 11:02:26.612	2026-04-09 11:02:26.612
1765e834-e2e7-44ba-91eb-8fc16455b99c	Office Equipment	Auto-generated from Asset migration	t	2026-04-09 11:02:26.619	2026-04-09 11:02:26.619
8fd1fa9a-eaf0-493c-adad-3f2ca77a46d0	Transportation	Auto-generated from Asset migration	t	2026-04-09 11:02:26.627	2026-04-09 11:02:26.627
731f0df0-e715-4413-8933-c5d91f33e222	Security	Auto-generated from Asset migration	t	2026-04-09 11:02:26.642	2026-04-09 11:02:26.642
33e7693a-7c84-466b-994d-f76939cea6ef	Facility	Auto-generated from Asset migration	t	2026-04-09 11:02:26.664	2026-04-09 11:02:26.664
\.


--
-- Data for Name: product_masters; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.product_masters (id, "masterCode", "masterName", description, "isActive", "createdAt", "updatedAt", "medicineId", "categoryId", image) FROM stdin;
b113f05e-82b9-49a9-a0b6-bc5b60fe218c	MSTR-PROD-MED-M1	Sanmol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	t	2026-04-09 10:52:46.887	2026-04-09 10:52:46.887	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
511709df-d2d6-4af4-874c-b9721638b6a3	MSTR-PROD-MED-M2	Bodrex	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	t	2026-04-09 10:52:46.899	2026-04-09 10:52:46.899	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3eed81c1-107b-4c43-b388-5761df02a811	MSTR-PROD-MED-M3	Farnox	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	t	2026-04-09 10:52:46.904	2026-04-09 10:52:46.904	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8872de42-3baa-4951-a103-74f10ffc9195	MSTR-PROD-MED-M4	Ponalac	Nyeri rematik, asam urat, dan nyeri haid	t	2026-04-09 10:52:46.909	2026-04-09 10:52:46.909	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
62013ef6-e19d-43a8-9cda-c753feb5bdc8	MSTR-PROD-MED-M5	Amoxan	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	t	2026-04-09 10:52:46.913	2026-04-09 10:52:46.913	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
4a6d2e72-3aec-4327-a398-1b6c46065d41	MSTR-PROD-MED-M6	Ciflos	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	t	2026-04-09 10:52:46.918	2026-04-09 10:52:46.918	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f05fecd5-1be3-4e66-b4b9-d98d50778d3d	MSTR-PROD-MED-M7	Kalmethrox	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	t	2026-04-09 10:52:46.923	2026-04-09 10:52:46.923	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7bfd02c2-aee9-4dbd-ac1b-96518bd5ec06	MSTR-PROD-MED-M8	Promag	Mengatasi maag, perut kembung, dan nyeri lambung	t	2026-04-09 10:52:46.926	2026-04-09 10:52:46.926	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d7063b84-0e71-40f1-9062-8132bf2eccfe	MSTR-PROD-MED-M9	Bio Gastra	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	t	2026-04-09 10:52:46.929	2026-04-09 10:52:46.929	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5fb18065-a4bc-4fd7-bf24-dad6152aa614	MSTR-PROD-MED-M10	Lasal	Bronkodilator untuk asma dan sesak napas	t	2026-04-09 10:52:46.933	2026-04-09 10:52:46.933	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
e24a92d6-66ae-4347-8f82-8a8f1c8a2e09	MSTR-PROD-MED-M11	OBH Combi	Meredakan batuk berdahak dan batuk kering	t	2026-04-09 10:52:46.936	2026-04-09 10:52:46.936	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
de1d8efb-4aa6-493c-b349-97c9113aab4f	MSTR-PROD-MED-M12	Woods	Mengencerkan dahak pada batuk berdahak	t	2026-04-09 10:52:46.939	2026-04-09 10:52:46.939	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f55fa5c3-79ce-4a75-8fc1-515564f469a6	MSTR-PROD-MED-M13	Antimo	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	t	2026-04-09 10:52:46.944	2026-04-09 10:52:46.944	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
706627a9-ef96-49d3-9a32-b59293f71690	MSTR-PROD-MED-M14	Cetirizine	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	t	2026-04-09 10:52:46.949	2026-04-09 10:52:46.949	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
28ae20d7-97d3-4f14-a9ac-57096209cc66	MSTR-PROD-MED-M15	Lorastine	Antihistamin non-sedatif untuk alergi kronis	t	2026-04-09 10:52:46.954	2026-04-09 10:52:46.954	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
01f410d4-b32f-47df-8162-4838e39008ad	MSTR-PROD-MED-M16	CTM	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	t	2026-04-09 10:52:46.958	2026-04-09 10:52:46.958	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
70b1b27a-75c2-4cf9-9c68-af19a95c2e67	MSTR-PROD-MED-M17	Dextamine	Kortikosteroid untuk peradangan berat dan alergi berat	t	2026-04-09 10:52:46.962	2026-04-09 10:52:46.962	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
84acf95b-4bf2-4f94-94d9-4e8b324e3d43	MSTR-PROD-MED-M18	Glucolin	Sumber energi cepat untuk pasien lemas atau dehidrasi	t	2026-04-09 10:52:46.966	2026-04-09 10:52:46.966	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
97281480-2666-4ca7-801a-20659e62c800	MSTR-PROD-MED-M19	Enervon-C	Multivitamin untuk daya tahan tubuh dan pemulihan	t	2026-04-09 10:52:46.969	2026-04-09 10:52:46.969	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f0e09ddf-2075-4e37-84c4-5a71a35079bc	MSTR-PROD-MED-M20	Sangobion	Mengatasi anemia (kekurangan darah)	t	2026-04-09 10:52:46.972	2026-04-09 10:52:46.972	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
03e409ad-27f5-4c5f-aabf-1274503d6f71	MSTR-PROD-MED-M21	Diapet	Mengatasi diare akut dan kronis	t	2026-04-09 10:52:46.976	2026-04-09 10:52:46.976	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3a2be611-ef87-4247-9ce8-e9d0bd54046b	MSTR-PROD-MED-M22	New Diatabs	Menghentikan diare akut dengan mengurangi pergerakan usus	t	2026-04-09 10:52:46.979	2026-04-09 10:52:46.979	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
16ce8392-3832-43e6-9552-a73a336773bd	MSTR-PROD-MED-M23	Bisolvon	Mengencerkan dahak pada batuk berdahak	t	2026-04-09 10:52:46.984	2026-04-09 10:52:46.984	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
a0789ef3-5835-4a30-aecc-8041d423bd8f	MSTR-PROD-MED-M24	Flutamol	Antidepresan untuk depresi, OCD, dan bulimia	t	2026-04-09 10:52:46.987	2026-04-09 10:52:46.987	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
9f227231-3c7f-4f90-904f-bc16e6bd0b49	MSTR-PROD-MED-M25	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	t	2026-04-09 10:52:46.991	2026-04-09 10:52:46.991	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
9ee48a88-b7c3-49c7-88c0-0f948c2db924	MSTR-PROD-MED-M26	Betadine	Antiseptik untuk luka dan persiapan operasi	t	2026-04-09 10:52:46.994	2026-04-09 10:52:46.994	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
93545dcc-a7a3-464c-9297-332552d4b568	MSTR-PROD-MED-M27	Kalpanax	Obat penenang untuk kecemasan berat dan relaksasi otot	t	2026-04-09 10:52:46.998	2026-04-09 10:52:46.998	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
e0407983-d5d5-4a58-afd2-75dbf7643846	MSTR-PROD-MED-M28	Nifedipine	Antihipertensi untuk tekanan darah tinggi	t	2026-04-09 10:52:47.001	2026-04-09 10:52:47.001	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
592980a4-bcd2-4d7d-92d3-c95daf5c4cef	MSTR-PROD-MED-M29	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	t	2026-04-09 10:52:47.004	2026-04-09 10:52:47.004	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
aaa9b009-f0a4-4e7c-b4be-3ac8e4a0e048	MSTR-PROD-MED-M30	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	t	2026-04-09 10:52:47.006	2026-04-09 10:52:47.006	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f9f16067-1467-4dcd-8c3a-a83694f3b1c8	MSTR-PROD-MED-M31	Metformin	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	t	2026-04-09 10:52:47.009	2026-04-09 10:52:47.009	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ab19eccd-5d4d-4077-b7bd-0b2b3242b0fd	MSTR-PROD-MED-M32	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	t	2026-04-09 10:52:47.012	2026-04-09 10:52:47.012	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
13fc7b7b-a477-42c5-8d26-d73f232a2f32	MSTR-PROD-MED-M33	Allopurinol	Mencegah serangan asam urat (gout)	t	2026-04-09 10:52:47.015	2026-04-09 10:52:47.015	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
84fc9a75-e499-4ffb-bd84-fd6fb5027d61	MSTR-PROD-MED-M34	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	t	2026-04-09 10:52:47.019	2026-04-09 10:52:47.019	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
6f8a796d-f617-4563-a9f2-2b2c5e5471a4	MSTR-PROD-MED-M35	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	t	2026-04-09 10:52:47.022	2026-04-09 10:52:47.022	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
16f41081-7cd8-4281-84c6-685c7842f1e8	MSTR-PROD-MED-M36	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	t	2026-04-09 10:52:47.024	2026-04-09 10:52:47.024	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
1f599b7e-6c26-4e0e-a151-792480acf220	MSTR-PROD-MED-M37	Albendazole	Antelmintik spektrum luas untuk cacingan	t	2026-04-09 10:52:47.027	2026-04-09 10:52:47.027	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
739d5f70-8959-4c81-b5b9-a7931192ecc6	MSTR-PROD-MED-M38	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	t	2026-04-09 10:52:47.03	2026-04-09 10:52:47.03	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f2db7d84-e5cd-4d62-8997-b56f234724f8	MSTR-PROD-MED-M39	Warfarin	Antikoagulan untuk mencegah pembekuan darah	t	2026-04-09 10:52:47.033	2026-04-09 10:52:47.033	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
e53a1910-e1d3-4d71-970a-f719ad95d611	MSTR-PROD-MED-M40	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	t	2026-04-09 10:52:47.037	2026-04-09 10:52:47.037	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
186eb9d0-e4be-4f4d-bd30-da95fec0dd94	MSTR-PROD-MED-M41	Furosemide	Diuretik kuat untuk edema dan hipertensi	t	2026-04-09 10:52:47.04	2026-04-09 10:52:47.04	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
18289cd9-8f87-453e-b88a-e738d18c4e27	MSTR-PROD-MED-M42	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	t	2026-04-09 10:52:47.096	2026-04-09 10:52:47.096	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3e8902e7-793a-4c91-964a-d4bcd85d2428	MSTR-PROD-MED-M43	Levothyroxine	Hormon tiroid untuk hipotiroidisme	t	2026-04-09 10:52:47.1	2026-04-09 10:52:47.1	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5cddc85c-aa8d-403e-8020-5a89453c1232	MSTR-PROD-MED-M44	Clopidogrel	Antiplatelet untuk mencegah stroke dan serangan jantung	t	2026-04-09 10:52:47.103	2026-04-09 10:52:47.103	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7730d97d-a737-42b1-9513-567ac6ca5229	MSTR-PROD-MED-M45	Amlodipine	Antihipertensi golongan CCB untuk hipertensi	t	2026-04-09 10:52:47.106	2026-04-09 10:52:47.106	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3f56b07e-ced4-493b-b3f6-e81eb40b3b66	MSTR-PROD-MED-M46	Losartan	Antihipertensi golongan ARB untuk hipertensi	t	2026-04-09 10:52:47.109	2026-04-09 10:52:47.109	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3c7f6882-1f68-4df8-8a7d-2909c19c49bf	MSTR-PROD-MED-M47	Bisoprolol	Beta-blocker untuk hipertensi dan gagal jantung	t	2026-04-09 10:52:47.112	2026-04-09 10:52:47.112	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
351b1ef7-0725-4984-bd20-da9498864bcc	MSTR-PROD-MED-M48	Insulin NPH	Insulin kerja menengah untuk diabetes melitus	t	2026-04-09 10:52:47.116	2026-04-09 10:52:47.116	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7b1b9aa2-8b0b-4665-acb3-a15ed5df701f	MSTR-PROD-MED-M49	Epinephrine	Untuk syok anafilaksis dan henti jantung	t	2026-04-09 10:52:47.119	2026-04-09 10:52:47.119	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
df8c48a6-f32a-4fc3-8ed3-49ff67c8dbcc	MSTR-PROD-MED-M50	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	t	2026-04-09 10:52:47.122	2026-04-09 10:52:47.122	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
c2672bbc-c243-455f-8da5-7ed313e9627d	MSTR-PROD-MED-M51	Ceftriaxone	Antibiotik suntik spektrum luas untuk infeksi berat	t	2026-04-09 10:52:47.125	2026-04-09 10:52:47.125	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d3a55bf9-cfce-44f4-9406-eba7e154646e	MSTR-PROD-MED-M52	Gentamicin	Antibiotik aminoglikosida untuk infeksi gram negatif	t	2026-04-09 10:52:47.128	2026-04-09 10:52:47.128	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
328f9548-1776-41b9-bf0e-2e5d4f4016ab	MSTR-PROD-MED-M53	Ketorolac	Analgesik kuat untuk nyeri sedang-berat pasca operasi	t	2026-04-09 10:52:47.13	2026-04-09 10:52:47.13	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5ab7d817-6189-4b84-996a-169fb1e83886	MSTR-PROD-MED-M54	Ondansetron	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	t	2026-04-09 10:52:47.134	2026-04-09 10:52:47.134	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
4197a8fb-576d-44e4-9083-9ecf22ae2652	MSTR-PROD-MED-M55	Dexamethasone	Kortikosteroid untuk inflamasi dan alergi berat	t	2026-04-09 10:52:47.138	2026-04-09 10:52:47.138	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
edc20f90-f930-4e11-98dd-1d83147349ff	MSTR-PROD-MED-M56	Paracetamol Infus	Antipiretik untuk demam tinggi pada pasien rawat inap	t	2026-04-09 10:52:47.141	2026-04-09 10:52:47.141	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d68c711a-bf4b-4c57-b3da-f6363b30251b	MSTR-PROD-MED-M57	Ringers Lactate	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	t	2026-04-09 10:52:47.144	2026-04-09 10:52:47.144	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
477786f7-2ff1-4b15-8241-6a0dffbe844e	MSTR-PROD-MED-M58	NaCl 0.9%	Cairan infus isotonik untuk dehidrasi	t	2026-04-09 10:52:47.146	2026-04-09 10:52:47.146	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
dba99ec2-6c81-4e61-82b3-ebe65a3f607a	MSTR-PROD-MED-M59	Dextrose 5%	Sumber energi untuk pasien lemas atau hipoglikemia	t	2026-04-09 10:52:47.15	2026-04-09 10:52:47.15	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d86b2c49-baf6-49b0-8eca-e652ced0d088	MSTR-PROD-MED-M60	Hydrocortisone Cream	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	t	2026-04-09 10:52:47.153	2026-04-09 10:52:47.153	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ba8a3c08-f1f6-48d9-94bc-606b6bba5400	MSTR-PROD-SUP-HANDSCHOEN-LATEX-S	Handschoen Latex S	\N	t	2026-04-09 10:52:47.156	2026-04-09 10:52:47.156	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8337fa3e-0799-42ca-87b8-fa11d002dd8e	MSTR-PROD-SUP-HANDSCHOEN-LATEX-M	Handschoen Latex M	\N	t	2026-04-09 10:52:47.159	2026-04-09 10:52:47.159	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
9a248a68-0110-4747-94bb-86bff9d58a97	MSTR-PROD-SUP-HANDSCHOEN-LATEX-L	Handschoen Latex L	\N	t	2026-04-09 10:52:47.162	2026-04-09 10:52:47.162	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f0fd9a0f-ff78-421f-9ae1-7fdd4f968b96	MSTR-PROD-SUP-MASKER-BEDAH-3-PLY	Masker Bedah 3-Ply	\N	t	2026-04-09 10:52:47.165	2026-04-09 10:52:47.165	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
dd5f6172-ecb6-4369-95b5-80bfce9da4ad	MSTR-PROD-SUP-SPUIT-1CC	Spuit 1cc	\N	t	2026-04-09 10:52:47.169	2026-04-09 10:52:47.169	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
08508630-9565-4b46-9224-05a5f95c1344	MSTR-PROD-SUP-SPUIT-3CC	Spuit 3cc	\N	t	2026-04-09 10:52:47.176	2026-04-09 10:52:47.176	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
67e472cd-7b20-44f8-a085-d1fa4e7e161c	MSTR-PROD-SUP-SPUIT-5CC	Spuit 5cc	\N	t	2026-04-09 10:52:47.182	2026-04-09 10:52:47.182	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
573d06c4-d878-421b-9202-d620c19ee6e6	MSTR-PROD-SUP-ALCOHOL-SWAB	Alcohol Swab	\N	t	2026-04-09 10:52:47.187	2026-04-09 10:52:47.187	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
68a067bc-d585-406c-a3dd-40ef7dc38c54	MSTR-PROD-SUP-ABOCATH-G20-(PINK)	Abocath G20 (Pink)	\N	t	2026-04-09 10:52:47.192	2026-04-09 10:52:47.192	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7619e2c0-6b65-4748-abfe-ed9ad147f85e	MSTR-PROD-SUP-ABOCATH-G22-(BLUE)	Abocath G22 (Blue)	\N	t	2026-04-09 10:52:47.197	2026-04-09 10:52:47.197	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
c7d679a0-671d-4f76-976e-ea4cb1c78dab	MSTR-PROD-SUP-INFUSION-SET-DEWASA	Infusion Set Dewasa	\N	t	2026-04-09 10:52:47.202	2026-04-09 10:52:47.202	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8cea249e-d37b-4161-a4ee-98be2ca2c208	MSTR-PROD-SUP-INFUSION-SET-ANAK	Infusion Set Anak	\N	t	2026-04-09 10:52:47.206	2026-04-09 10:52:47.206	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8ce4b0f0-a291-4b7a-a342-7cdfb754f5ba	MSTR-PROD-SUP-KASA-STERIL-10X10	Kasa Steril 10x10	\N	t	2026-04-09 10:52:47.21	2026-04-09 10:52:47.21	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f591c210-13c3-4877-a435-6d7f4ad4f961	MSTR-PROD-SUP-MICROPORE-1-INCH	Micropore 1 inch	\N	t	2026-04-09 10:52:47.216	2026-04-09 10:52:47.216	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2c47796c-b40f-4acf-b09b-68f88777a304	MSTR-PROD-SUP-UNDERPAD	Underpad	\N	t	2026-04-09 10:52:47.221	2026-04-09 10:52:47.221	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
dfb70d14-5753-4ba8-a870-bf9be4f02419	MSTR-PROD-SUP-URINAL-BAG	Urinal Bag	\N	t	2026-04-09 10:52:47.224	2026-04-09 10:52:47.224	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
efbc81ad-ba3e-48cd-b934-e4459f54d21c	MSTR-PROD-SUP-VERBAND-GULUNG-10CM	Verband Gulung 10cm	\N	t	2026-04-09 10:52:47.227	2026-04-09 10:52:47.227	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
1d3b6da1-4c9b-40a6-bf37-57749533389d	MSTR-PROD-SUP-BETADINE-1-LITER	Betadine 1 Liter	\N	t	2026-04-09 10:52:47.231	2026-04-09 10:52:47.231	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
fac61ec2-1f9c-4523-8886-fd503c621776	MSTR-PROD-SUP-ASEPTIC-GEL-500ML	Aseptic Gel 500ml	\N	t	2026-04-09 10:52:47.234	2026-04-09 10:52:47.234	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5bdce515-de02-4abd-b334-03fe5c55d78c	MSTR-PROD-ALKES-TERMOMETER-DIGITAL	Termometer Digital	\N	t	2026-04-09 10:52:47.237	2026-04-09 10:52:47.237	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
fb7875da-2b84-49b0-9bbe-421992a1e638	MSTR-PROD-ALKES-OXIMETER-FINGERTIP	Oximeter Fingertip	\N	t	2026-04-09 10:52:47.24	2026-04-09 10:52:47.24	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
e5007c93-22d3-4681-a77a-7230dcde33fd	MSTR-PROD-ALKES-TENSIMETER-DIGITAL-OMRON	Tensimeter Digital Omron	\N	t	2026-04-09 10:52:47.243	2026-04-09 10:52:47.243	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3e4ae42e-41ab-4f27-8d21-996bb3cfaf34	MSTR-PROD-ALKES-TENSIMETER-ANEROID-(MANUAL)	Tensimeter Aneroid (Manual)	\N	t	2026-04-09 10:52:47.246	2026-04-09 10:52:47.246	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
216b9a59-928d-4214-ac0a-1768b5916746	MSTR-PROD-ALKES-STETOSKOP-LITTMANN-STYLE	Stetoskop Littmann Style	\N	t	2026-04-09 10:52:47.249	2026-04-09 10:52:47.249	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
c8b053a8-a408-4300-846e-15b3abcbd3a6	MSTR-PROD-ALKES-GLUCO-CHECK-KIT	Gluco-Check Kit	\N	t	2026-04-09 10:52:47.252	2026-04-09 10:52:47.252	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
9bf7c21d-b497-4a33-a7a7-0f8b250afb2d	MSTR-PROD-ALKES-NEBULIZER-MACHINE-PORTABLE	Nebulizer Machine Portable	\N	t	2026-04-09 10:52:47.255	2026-04-09 10:52:47.255	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3381e8b7-f45e-4452-b9b9-998bc0a4c4b3	MSTR-PROD-ALKES-TABUNG-OKSIGEN-1M3-(SET)	Tabung Oksigen 1m3 (Set)	\N	t	2026-04-09 10:52:47.258	2026-04-09 10:52:47.258	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
86e78c6d-d491-4fa7-bd58-4dabbe7f281e	MSTR-PROD-ALKES-TERMOMETER-INFRARED-(GUN)	Termometer Infrared (Gun)	\N	t	2026-04-09 10:52:47.26	2026-04-09 10:52:47.26	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
703eb43b-e56f-4c46-b016-b4ba0db057bc	MSTR-AS-MED-USG4D-K001-PC	USG 4D Mindray DC-70	\N	t	2026-04-09 10:52:47.263	2026-04-09 10:52:47.263	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
31623348-a15c-4ebb-a96a-80000326fe1b	MSTR-AS-MED-ECG-K001-PC	ECG 12-Channel GE MAC 2000	\N	t	2026-04-09 10:52:47.267	2026-04-09 10:52:47.267	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ffeb3b0e-ac3f-4d8e-b9c8-859d5681bc26	MSTR-AS-MED-DENTAL-K001-PC	Dental Chair Unit Anthos A3	\N	t	2026-04-09 10:52:47.27	2026-04-09 10:52:47.27	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
bd5d718e-275a-49bb-abb2-ed13e3516a8f	MSTR-AS-MED-AUTO-K001-PC	Autoclave Getinge HS33	\N	t	2026-04-09 10:52:47.273	2026-04-09 10:52:47.273	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
346f29fa-5cdb-4009-b835-598252be9652	MSTR-AS-VEH-AMB-K001-PC	Ambulance Toyota Hiace Medis (Advance)	\N	t	2026-04-09 10:52:47.275	2026-04-09 10:52:47.275	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ff6ca215-d3ad-4bbd-8619-97b8470576d3	MSTR-AS-FAC-AC-INV-K001-PC	AC Daikin Multi-S 3 Connection	\N	t	2026-04-09 10:52:47.278	2026-04-09 10:52:47.278	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2c757cee-ead0-4c02-96c8-26543453a927	MSTR-AS-OFF-IMAC-K001-PC	iMac 24" M3 16GB/512GB (Reception)	\N	t	2026-04-09 10:52:47.281	2026-04-09 10:52:47.281	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
b9f99ff6-ea86-4a46-837a-0b8a80b3dc2c	MSTR-AS-OFF-AERON-K001-PC	Herman Miller Aeron Chair	\N	t	2026-04-09 10:52:47.284	2026-04-09 10:52:47.284	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2b6e14b9-c571-41c8-aa6a-8ccf998c7369	MSTR-AS-LAB-HEM-K001-PC	Hematology Analyzer Sysmex XN-350	\N	t	2026-04-09 10:52:47.287	2026-04-09 10:52:47.287	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
15443f10-60e0-4a71-8a73-be6790bac169	MSTR-AS-FAC-TV75-K001-PC	Smart TV Samsung 75" Neo QLED	\N	t	2026-04-09 10:52:47.29	2026-04-09 10:52:47.29	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
6067dd34-b594-4618-8a29-047780093f1f	MSTR-AS-IT-SVR-K001-PC	Server NAS Synology DS923+	\N	t	2026-04-09 10:52:47.314	2026-04-09 10:52:47.314	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3d89e205-0169-4849-98fc-0c82a3999391	MSTR-AS-IT-WIFI-K001-PC	Ubiquiti UniFi Dream Machine Pro (WiFi System)	\N	t	2026-04-09 10:52:47.318	2026-04-09 10:52:47.318	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
600175dd-40be-45b9-b84a-daea3fddeafc	MSTR-AS-IT-LP1-K001-PC	Laptop MacBook Air 13" M3 16GB (Manajemen)	\N	t	2026-04-09 10:52:47.321	2026-04-09 10:52:47.321	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ee38f03d-915d-4e20-a378-2ad56978fb52	MSTR-AS-IT-PC1-K001-PC	PC Desktop Dell Optiplex 7010 (Admin Set)	\N	t	2026-04-09 10:52:47.324	2026-04-09 10:52:47.324	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
808da982-f94f-4964-8620-9190d365741f	MSTR-AS-IT-PRN-K001-PC	Printer Epson L3210 (Multifunction)	\N	t	2026-04-09 10:52:47.327	2026-04-09 10:52:47.327	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5bdf74e6-be7c-4468-8744-5d8a7232e611	MSTR-AS-VEH-CAR-K001-PC	Mobil Operasional Toyota Avanza Veloz	\N	t	2026-04-09 10:52:47.329	2026-04-09 10:52:47.329	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
fee316ab-bb0d-43e3-9272-429eea6d00c8	MSTR-AS-VEH-MTR2-K001-PC	Motor Operasional Yamaha NMAX 155	\N	t	2026-04-09 10:52:47.334	2026-04-09 10:52:47.334	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
530c4626-563f-447e-9f24-8b80506ab645	MSTR-AS-FAC-CCTV-K001-PC	CCTV System Hikvision 8-CH (Full HD)	\N	t	2026-04-09 10:52:47.337	2026-04-09 10:52:47.337	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
0428b1c9-571b-484d-b208-f8cf70f13d49	MSTR-AS-FAC-ABS-K001-PC	Mesin Absensi Face Recognition (Solution)	\N	t	2026-04-09 10:52:47.34	2026-04-09 10:52:47.34	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
0f1e05e8-0160-4fcd-8a20-67efa08a233c	MSTR-AS-FAC-AC-R1-K001-PC	AC Panasonic 1PK Inverter (Ruang Periksa 1)	\N	t	2026-04-09 10:52:47.343	2026-04-09 10:52:47.343	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
698274e1-0053-490c-9272-0b3e01f17342	MSTR-AS-FAC-AC-R2-K001-PC	AC Panasonic 1PK Inverter (Ruang Periksa 2)	\N	t	2026-04-09 10:52:47.346	2026-04-09 10:52:47.346	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
ca377b39-5d2c-45e4-b4c5-dc875c5b8732	MSTR-AS-FAC-AC-W-K001-PC	AC Panasonic 2PK Inverter (Ruang Tunggu)	\N	t	2026-04-09 10:52:47.35	2026-04-09 10:52:47.35	\N	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
a91701e0-4e68-452d-9d62-ebb37db8823d	AS-IT-SVR-K001-MASTER	Server NAS Synology DS923+	Operational Asset for Clinic Support	t	2026-04-09 11:02:11.178	2026-04-09 11:02:11.178	\N	3e4f08c3-7449-4ee0-82de-a92ff0f0ce98	\N
6f9eb70f-597d-4acb-b051-65add8a644dc	AS-IT-WIFI-K001-MASTER	Ubiquiti UniFi Dream Machine Pro (WiFi System)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.599	2026-04-09 11:02:26.599	\N	2dd458fa-d34b-4e0f-b079-f0130de9ebce	\N
8820e22b-4db9-444a-858c-97cf27e64900	AS-IT-LP1-K001-MASTER	Laptop MacBook Air 13" M3 16GB (Manajemen)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.607	2026-04-09 11:02:26.607	\N	d1d2970d-04fb-4f11-b191-9743956cff39	\N
5f63d138-9478-4fe1-83a3-9f673cf850b7	AS-IT-PC1-K001-MASTER	PC Desktop Dell Optiplex 7010 (Admin Set)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.614	2026-04-09 11:02:26.614	\N	da3ce8fc-b55d-4084-9686-472d8a2d5102	\N
285a8d39-323c-4e82-a0c6-cc90d126ef61	AS-IT-PRN-K001-MASTER	Printer Epson L3210 (Multifunction)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.62	2026-04-09 11:02:26.62	\N	1765e834-e2e7-44ba-91eb-8fc16455b99c	\N
3b7419c8-d502-45eb-bdc1-e4afe85ffa9f	AS-VEH-CAR-K001-MASTER	Mobil Operasional Toyota Avanza Veloz	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.629	2026-04-09 11:02:26.629	\N	8fd1fa9a-eaf0-493c-adad-3f2ca77a46d0	\N
ea19caa2-4b7e-4776-8578-b99944912668	AS-VEH-MTR2-K001-MASTER	Motor Operasional Yamaha NMAX 155	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.635	2026-04-09 11:02:26.635	\N	8fd1fa9a-eaf0-493c-adad-3f2ca77a46d0	\N
204d9662-77e6-4abb-8861-82ba45be3070	AS-FAC-CCTV-K001-MASTER	CCTV System Hikvision 8-CH (Full HD)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.644	2026-04-09 11:02:26.644	\N	731f0df0-e715-4413-8933-c5d91f33e222	\N
8920e3a3-4c11-41bc-b926-5ea9f7dbcbc8	AS-FAC-ABS-K001-MASTER	Mesin Absensi Face Recognition (Solution)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.655	2026-04-09 11:02:26.655	\N	731f0df0-e715-4413-8933-c5d91f33e222	\N
4bc20ee1-e855-49a4-a5d6-e30ce9453b55	AS-FAC-AC-R1-K001-MASTER	AC Panasonic 1PK Inverter (Ruang Periksa 1)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.666	2026-04-09 11:02:26.666	\N	33e7693a-7c84-466b-994d-f76939cea6ef	\N
cf7c99b7-a1f2-403a-9539-79ca339dc13b	AS-FAC-AC-R2-K001-MASTER	AC Panasonic 1PK Inverter (Ruang Periksa 2)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.678	2026-04-09 11:02:26.678	\N	33e7693a-7c84-466b-994d-f76939cea6ef	\N
84bb17c4-e321-4918-a6e9-82b41177393a	AS-FAC-AC-W-K001-MASTER	AC Panasonic 2PK Inverter (Ruang Tunggu)	Operational Asset for Clinic Support	t	2026-04-09 11:02:26.69	2026-04-09 11:02:26.69	\N	33e7693a-7c84-466b-994d-f76939cea6ef	\N
b18373b2-c7bb-441b-9754-998b2edb2fc4	MED-729NF9	Sanmol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	t	2026-04-10 02:25:51.328	2026-04-10 02:25:51.328	3da3169a-d958-4783-8803-3ab23d7056c2	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
b1f9ce70-c713-4732-93bb-82d4c0900b2e	MED-Q9TCH	Bodrex	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	t	2026-04-10 02:25:51.345	2026-04-10 02:25:51.345	8cc31768-1312-4e52-8abc-7230922f3a89	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
a588591a-a27d-4bc9-9044-e1242a89b118	MED-1RNES	Farnox	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	t	2026-04-10 02:25:51.351	2026-04-10 02:25:51.351	f01c6bad-63ce-4a67-9953-da18d28ea8a4	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2fd56395-160e-4139-bf3d-949f3db46659	MED-ESHBJ	Ponalac	Nyeri rematik, asam urat, dan nyeri haid	t	2026-04-10 02:25:51.357	2026-04-10 02:25:51.357	2ac557a9-ada8-433d-974c-df86dcf549d7	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
efe0767e-8aa2-414d-98f8-fcfdb21cfc8a	MED-3ANN45	Ciflos	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	t	2026-04-10 02:25:51.367	2026-04-10 02:25:51.367	485b2859-44a5-4296-a445-3b65eebde2d8	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2567fc39-aac0-407d-9e8c-6d3efeaf1c68	MED-5X3G19	Kalmethrox	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	t	2026-04-10 02:25:51.372	2026-04-10 02:25:51.372	946285d8-373c-4bce-ac36-398c0e59fc2a	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
871431b9-da3d-43c1-bdc2-419274673286	MED-AAEFO	Promag	Mengatasi maag, perut kembung, dan nyeri lambung	t	2026-04-10 02:25:51.376	2026-04-10 02:25:51.376	7f049d2f-7dca-4bf9-b7b1-3ab44e2fc8c0	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
4454c9af-fe3f-4f39-ae01-f50e8cb6a60d	MED-VTW8B	Bio Gastra	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	t	2026-04-10 02:25:51.38	2026-04-10 02:25:51.38	35b7c5e0-236a-40af-a1d0-ccc535475d25	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3c6ba828-8591-49e0-9507-46230d2c62d0	MED-IB0HN	Lasal	Bronkodilator untuk asma dan sesak napas	t	2026-04-10 02:25:51.385	2026-04-10 02:25:51.385	8957083b-3fad-4658-83ca-788dcf694ad6	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
a6d6bd8d-5c97-4ea6-8b9f-30a3097b5b23	MED-V20O8K	OBH Combi	Meredakan batuk berdahak dan batuk kering	t	2026-04-10 02:25:51.388	2026-04-10 02:25:51.388	985756b1-a288-4ec5-9c18-0eccb449e783	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
87dd2ea4-e2a8-4243-9508-db8c7c228dcc	MED-NPTHWH	Woods	Mengencerkan dahak pada batuk berdahak	t	2026-04-10 02:25:51.392	2026-04-10 02:25:51.392	c1fd0954-97d6-4014-84d4-2663e7307600	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
073cac70-1baf-4b7a-ac09-68c49f0b0f76	MED-3PM4NG	Antimo	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	t	2026-04-10 02:25:51.396	2026-04-10 02:25:51.396	f471d6e0-2797-452d-a7ea-5a3623893064	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
cbabaf2a-5586-4141-99bb-c6782cf74b47	MED-49HT2	Cetirizine	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	t	2026-04-10 02:25:51.402	2026-04-10 02:25:51.402	f9d9d7fa-de64-4424-8a64-f922c1728518	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d548e8e0-8c70-4d9f-bf55-1016c01b5d33	MED-BYWH3S	Lorastine	Antihistamin non-sedatif untuk alergi kronis	t	2026-04-10 02:25:51.406	2026-04-10 02:25:51.406	ca27fdde-1673-4633-831d-78b80dc406ab	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
1248cebc-70f9-467c-9b29-e1dc2de2b71e	MED-WKYKFP	CTM	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	t	2026-04-10 02:25:51.409	2026-04-10 02:25:51.409	94c272e6-5faf-4566-b21b-4daafc705b38	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5489aac8-de64-4a95-b391-c008d2e2c401	MED-WOXXI	Dextamine	Kortikosteroid untuk peradangan berat dan alergi berat	t	2026-04-10 02:25:51.413	2026-04-10 02:25:51.413	f0552ea5-1152-4c69-85bd-8208a534b1e4	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
9cb1a9b0-6fa9-4bcc-8207-87ad7f1a8c06	MED-3EZ3DG	Glucolin	Sumber energi cepat untuk pasien lemas atau dehidrasi	t	2026-04-10 02:25:51.418	2026-04-10 02:25:51.418	f9456bdc-21a2-4ced-9fc5-ff9a7b8cddf0	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
584ca180-a10c-4149-bccc-1481fb4471e5	MED-58PB3O	Enervon-C	Multivitamin untuk daya tahan tubuh dan pemulihan	t	2026-04-10 02:25:51.422	2026-04-10 02:25:51.422	7f479fe8-a087-4ba4-959d-45e31594bcc9	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
c53b4e94-b1ad-4d36-acf8-bc6e856d6c1c	MED-C8A5L	Sangobion	Mengatasi anemia (kekurangan darah)	t	2026-04-10 02:25:51.425	2026-04-10 02:25:51.425	dd10f39a-77c8-4bc3-854c-d5e2eb80c21b	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2dbf01a3-e3a4-4e63-aa9a-b073dff32daf	MED-ZOJWY	Diapet	Mengatasi diare akut dan kronis	t	2026-04-10 02:25:51.428	2026-04-10 02:25:51.428	a22facf2-8dca-4a59-af33-a66adf03b53b	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
c8f111a5-d72d-4bb0-89f6-5f608422df6e	MED-RKJLQF	New Diatabs	Menghentikan diare akut dengan mengurangi pergerakan usus	t	2026-04-10 02:25:51.432	2026-04-10 02:25:51.432	62d13715-4611-4f53-8e56-63abbd1a9e17	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
886a977d-ae8d-4ce3-9a18-a7630d633496	MED-0NXIBE	Bisolvon	Mengencerkan dahak pada batuk berdahak	t	2026-04-10 02:25:51.436	2026-04-10 02:25:51.436	8cc11d77-b47d-43b2-ab8b-a54e18dbcf2e	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
51fda82d-adea-40a1-bd26-e04852c68a55	MED-R5ZHKI	Flutamol	Antidepresan untuk depresi, OCD, dan bulimia	t	2026-04-10 02:25:51.439	2026-04-10 02:25:51.439	e3f8eb44-1775-41e6-a337-0a01885e98ab	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
a142eb01-904e-4e03-b21e-76b811707d06	MED-QBABV	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	t	2026-04-10 02:25:51.442	2026-04-10 02:25:51.442	968d1d26-ab39-4ded-b98b-e6505a1d8fe8	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
bcd2b17b-2dd7-4e9d-9cc5-21dc2a410ba6	MED-Z13OHN	Betadine	Antiseptik untuk luka dan persiapan operasi	t	2026-04-10 02:25:51.445	2026-04-10 02:25:51.445	1e443a27-e3f3-4606-bec5-0f9d0e6de613	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
6a837a97-2285-4728-8462-d1dde911a974	MED-PN7KSE	Kalpanax	Obat penenang untuk kecemasan berat dan relaksasi otot	t	2026-04-10 02:25:51.449	2026-04-10 02:25:51.449	30bbcbe7-dc2c-4c7e-963d-ea69649d4e9c	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
d12a4285-0c1d-4987-bfd4-4d9fe7db9fe6	MED-F8L6CT	Nifedipine	Antihipertensi untuk tekanan darah tinggi	t	2026-04-10 02:25:51.453	2026-04-10 02:25:51.453	283a3caf-d377-4118-8bec-2978626531ee	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
b19b2c2c-d1ec-49bd-abf6-fae54218285b	MED-8OX21R	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	t	2026-04-10 02:25:51.458	2026-04-10 02:25:51.458	cf31bf43-cad7-4b22-b89b-ad98ce0dfc6c	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
0ed884c6-0df8-4d21-8fc4-0ec46063adba	MED-39LZ7G	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	t	2026-04-10 02:25:51.461	2026-04-10 02:25:51.461	9917b97d-9474-4755-ac51-02691fdbb3b4	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
84342180-17bb-48c1-9c6d-60ddabf66bf7	MED-OQC448	Metformin	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	t	2026-04-10 02:25:51.464	2026-04-10 02:25:51.464	68b43f8a-8585-4831-9a2d-e5d09e81c628	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
34e7bdf2-8b30-42bb-8b7b-4e591934741a	MED-FV5AK9	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	t	2026-04-10 02:25:51.469	2026-04-10 02:25:51.469	55fa8d9d-0f52-45e0-b1c7-b04ce54ff631	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8c95dca7-351f-44f1-8f38-80148dee8c08	MED-KQN7A	Allopurinol	Mencegah serangan asam urat (gout)	t	2026-04-10 02:25:51.472	2026-04-10 02:25:51.472	8c658c25-ba08-431b-8d79-6858c70bddd1	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
55f77d77-d320-41b7-8d25-20be513df56b	MED-R0Q9Y	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	t	2026-04-10 02:25:51.475	2026-04-10 02:25:51.475	e821278e-a3eb-4185-b0b3-8fdd6660c6c4	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
4c2bcd44-db26-4766-a104-d6e3a52958c0	MED-5A7D8H	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	t	2026-04-10 02:25:51.478	2026-04-10 02:25:51.478	ba12557f-e844-476c-92ca-d5df8bba6c46	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
b798dffd-de3e-4a7d-be56-d16c47ada32a	MED-98XZM	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	t	2026-04-10 02:25:51.482	2026-04-10 02:25:51.482	0e48ad16-2d77-496e-9656-e5e461c2cf87	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7bf75b8a-e6ff-4ddf-ac20-956cbb7b40cc	MED-O18RYF	Albendazole	Antelmintik spektrum luas untuk cacingan	t	2026-04-10 02:25:51.486	2026-04-10 02:25:51.486	c83432ce-7d78-4444-bf2f-2e8df26d1229	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
4ba25a55-389f-4504-b716-52e8d4c137f7	MED-YHQFH	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	t	2026-04-10 02:25:51.49	2026-04-10 02:25:51.49	7574e35f-2db6-405d-a58b-4c512f12271e	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
e588ed67-96c1-4033-b93b-b09de382c90b	MED-A0LEA9	Warfarin	Antikoagulan untuk mencegah pembekuan darah	t	2026-04-10 02:25:51.493	2026-04-10 02:25:51.493	2c33982e-85ab-41bd-bdbc-0479dba5d1c6	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
8423eec8-38ae-41d8-8da5-468ec1c38f95	MED-ZO1TET	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	t	2026-04-10 02:25:51.496	2026-04-10 02:25:51.496	1e6c2322-93c9-45df-a7b5-d4889968cb28	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
3ab652d6-512a-427d-ab18-d816eff4043e	MED-XQK9LK	Furosemide	Diuretik kuat untuk edema dan hipertensi	t	2026-04-10 02:25:51.5	2026-04-10 02:25:51.5	8cf174f0-17b0-4860-8656-931f2aff9b15	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
cfa89e2e-4cf1-466f-809f-515b3a4ba197	MED-3ZCHLR	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	t	2026-04-10 02:25:51.505	2026-04-10 02:25:51.505	d6cbe71b-2946-44c4-b104-08bbe6fe7473	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
435279e3-338f-4953-9373-c8eab74b8d07	MED-BD4G3	Levothyroxine	Hormon tiroid untuk hipotiroidisme	t	2026-04-10 02:25:51.508	2026-04-10 02:25:51.508	e9fbd434-f960-4b86-8f41-a6c33b99d28c	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
05c439f0-3646-424d-acc5-e3906835ab30	MED-Z3RW5	Clopidogrel	Antiplatelet untuk mencegah stroke dan serangan jantung	t	2026-04-10 02:25:51.512	2026-04-10 02:25:51.512	48625807-83e4-43f6-adfe-8886b1293e3d	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
0f8fb934-5f1b-44a3-be48-5a5feddaec45	MED-WKV93	Amlodipine	Antihipertensi golongan CCB untuk hipertensi	t	2026-04-10 02:25:51.515	2026-04-10 02:25:51.515	3722d7be-9cf0-4c71-9ca2-48f6bb520fa2	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
1884783c-a41b-4ffd-80f4-4388913225c3	MED-EXBTZD	Losartan	Antihipertensi golongan ARB untuk hipertensi	t	2026-04-10 02:25:51.52	2026-04-10 02:25:51.52	192fb77c-9db0-4997-bfec-7830528eec84	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
6cbdc3c0-ca28-4528-95af-d58298f197c2	MED-2XBVEC	Bisoprolol	Beta-blocker untuk hipertensi dan gagal jantung	t	2026-04-10 02:25:51.523	2026-04-10 02:25:51.523	b01221e8-bb16-47eb-8a3d-8941f42fe10a	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
6de25f37-b71e-4b7b-9e68-1c167463cd26	MED-NWNEYB	Insulin NPH	Insulin kerja menengah untuk diabetes melitus	t	2026-04-10 02:25:51.526	2026-04-10 02:25:51.526	7679d460-d0b8-4aab-a351-df487b2d63b1	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
329937c4-35a0-4f7a-8026-f98fe42a0a57	MED-EDRPTJ	Epinephrine	Untuk syok anafilaksis dan henti jantung	t	2026-04-10 02:25:51.529	2026-04-10 02:25:51.529	12588182-c527-46f6-b1bc-196ddbeb76cb	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
95471f8f-fb10-4a86-a3c2-e83f028966e1	MED-BKFTC9	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	t	2026-04-10 02:25:51.533	2026-04-10 02:25:51.533	683adbfb-d782-4268-a96f-3e686328a37e	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
dd0e0f9f-e6d0-4546-8464-d07b04fdbec4	MED-B0IITD	Ceftriaxone	Antibiotik suntik spektrum luas untuk infeksi berat	t	2026-04-10 02:25:51.537	2026-04-10 02:25:51.537	4b4af086-5654-4398-9f65-64ad16e46b2a	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
304c7ba7-075e-451b-b09e-f52eb53e5ac1	MED-9F4CMJ	Gentamicin	Antibiotik aminoglikosida untuk infeksi gram negatif	t	2026-04-10 02:25:51.54	2026-04-10 02:25:51.54	97676799-1da5-4c87-9aed-7535920d3fa2	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
40755fe0-6dab-4098-8257-0abcce12d93b	MED-W6TEO	Ketorolac	Analgesik kuat untuk nyeri sedang-berat pasca operasi	t	2026-04-10 02:25:51.543	2026-04-10 02:25:51.543	cbab7e18-111b-49d7-a70e-386629462563	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
befdd2cb-ee5e-4586-a1c6-319c6ae516b5	MED-1MX8X	Ondansetron	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	t	2026-04-10 02:25:51.546	2026-04-10 02:25:51.546	ad465ef3-f81a-419c-b10c-25e6a9d3b6a2	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
f779b2d2-0e4b-4670-b7fe-a2f0419b7a22	MED-5G5WCC	Dexamethasone	Kortikosteroid untuk inflamasi dan alergi berat	t	2026-04-10 02:25:51.55	2026-04-10 02:25:51.55	d91f883f-10b7-4cd5-9bd3-5ed19547850b	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
5ad706d6-1996-4115-9bb2-c3b85b94b20d	MED-G10CI	Paracetamol Infus	Antipiretik untuk demam tinggi pada pasien rawat inap	t	2026-04-10 02:25:51.554	2026-04-10 02:25:51.554	70073f85-ccdd-4445-bba7-a56a464b8c4f	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
7fb41957-1f95-4482-954a-e4248e715a94	MED-EJP4G	Ringers Lactate	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	t	2026-04-10 02:25:51.557	2026-04-10 02:25:51.557	45218e67-4935-4e7c-8104-85647fb42789	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
53b680ad-b941-4900-a0d0-53892b6b4d49	MED-D96TF	NaCl 0.9%	Cairan infus isotonik untuk dehidrasi	t	2026-04-10 02:25:51.56	2026-04-10 02:25:51.56	19b31abf-2df3-4064-a31c-3cf64d691273	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
2b82182e-95cc-4fbb-9ebf-68d5c534fd59	MED-A5R58	Dextrose 5%	Sumber energi untuk pasien lemas atau hipoglikemia	t	2026-04-10 02:25:51.563	2026-04-10 02:25:51.563	edf53394-1e72-46f1-80a9-8d17c0ce2253	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
37374063-6c0b-47b1-84f0-17d667810f86	MED-046UA	Hydrocortisone Cream	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	t	2026-04-10 02:25:51.568	2026-04-10 02:25:51.568	def80307-5339-4f31-a3ad-043b24b961fc	969a8bb2-572e-44d2-b4c5-283ee339d3ba	\N
30be0f20-7925-4c17-9191-ba575d0374a4	MED-T2ETN6	Amoxan	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	t	2026-04-10 02:25:51.362	2026-04-10 03:13:53.839	08698dfa-0bbc-4acf-a964-81e9d34b0d91	969a8bb2-572e-44d2-b4c5-283ee339d3ba	/uploads/medicines/medicine-1775790833780.webp
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.products (id, "masterProductId", "productCode", sku, "productName", description, unit, "purchaseUnit", "storageUnit", "usedUnit", quantity, "minimumStock", "reorderQuantity", "purchasePrice", "sellingPrice", supplier, "lastPurchaseDate", "expiryDate", "isActive", "createdAt", "updatedAt", "clinicId") FROM stdin;
9ea56320-d944-4d8e-b270-a0467a324eca	b113f05e-82b9-49a9-a0b6-bc5b60fe218c	PROD-MED-M1	SKU-MED-M1	Sanmol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.894	2026-04-09 10:52:46.894	cdf427a7-bf4d-478e-97e7-7f24c214f584
f249ddbd-a606-4bcc-83d8-a58af5a1b94f	511709df-d2d6-4af4-874c-b9721638b6a3	PROD-MED-M2	SKU-MED-M2	Bodrex	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.902	2026-04-09 10:52:46.902	cdf427a7-bf4d-478e-97e7-7f24c214f584
f0f442d6-e77a-47c0-a19b-067962779e42	3eed81c1-107b-4c43-b388-5761df02a811	PROD-MED-M3	SKU-MED-M3	Farnox	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.907	2026-04-09 10:52:46.907	cdf427a7-bf4d-478e-97e7-7f24c214f584
9561771d-2590-4813-9159-6cb86301f4c8	8872de42-3baa-4951-a103-74f10ffc9195	PROD-MED-M4	SKU-MED-M4	Ponalac	Nyeri rematik, asam urat, dan nyeri haid	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.911	2026-04-09 10:52:46.911	cdf427a7-bf4d-478e-97e7-7f24c214f584
cf829e61-9a4b-40f3-8a34-906149d78f93	62013ef6-e19d-43a8-9cda-c753feb5bdc8	PROD-MED-M5	SKU-MED-M5	Amoxan	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.916	2026-04-09 10:52:46.916	cdf427a7-bf4d-478e-97e7-7f24c214f584
a2ddca26-d392-4fa3-b27d-9eabf26cf56c	4a6d2e72-3aec-4327-a398-1b6c46065d41	PROD-MED-M6	SKU-MED-M6	Ciflos	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.921	2026-04-09 10:52:46.921	cdf427a7-bf4d-478e-97e7-7f24c214f584
bc41de50-7725-4aac-935a-96cba49484c2	f05fecd5-1be3-4e66-b4b9-d98d50778d3d	PROD-MED-M7	SKU-MED-M7	Kalmethrox	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.924	2026-04-09 10:52:46.924	cdf427a7-bf4d-478e-97e7-7f24c214f584
45f2945b-1387-40c6-8f30-d41852285bda	7bfd02c2-aee9-4dbd-ac1b-96518bd5ec06	PROD-MED-M8	SKU-MED-M8	Promag	Mengatasi maag, perut kembung, dan nyeri lambung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.928	2026-04-09 10:52:46.928	cdf427a7-bf4d-478e-97e7-7f24c214f584
356ebe24-b68c-476b-a763-e19855673b32	d7063b84-0e71-40f1-9062-8132bf2eccfe	PROD-MED-M9	SKU-MED-M9	Bio Gastra	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.932	2026-04-09 10:52:46.932	cdf427a7-bf4d-478e-97e7-7f24c214f584
306815fd-e221-4ea9-b9f6-67dc9716d3e1	5fb18065-a4bc-4fd7-bf24-dad6152aa614	PROD-MED-M10	SKU-MED-M10	Lasal	Bronkodilator untuk asma dan sesak napas	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.935	2026-04-09 10:52:46.935	cdf427a7-bf4d-478e-97e7-7f24c214f584
8d23e410-27ea-4c42-9b77-3a79f5e6e4be	e24a92d6-66ae-4347-8f82-8a8f1c8a2e09	PROD-MED-M11	SKU-MED-M11	OBH Combi	Meredakan batuk berdahak dan batuk kering	Syrup	Box	Syrup	Syrup	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.938	2026-04-09 10:52:46.938	cdf427a7-bf4d-478e-97e7-7f24c214f584
7807e262-6da8-4f4b-88dd-ee2b7a324f2a	de1d8efb-4aa6-493c-b349-97c9113aab4f	PROD-MED-M12	SKU-MED-M12	Woods	Mengencerkan dahak pada batuk berdahak	Syrup	Box	Syrup	Syrup	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.942	2026-04-09 10:52:46.942	cdf427a7-bf4d-478e-97e7-7f24c214f584
66b17792-ea6d-4df0-b2e0-4063720108f7	f55fa5c3-79ce-4a75-8fc1-515564f469a6	PROD-MED-M13	SKU-MED-M13	Antimo	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.946	2026-04-09 10:52:46.946	cdf427a7-bf4d-478e-97e7-7f24c214f584
eeeaaedf-52b7-486f-a086-6207a11f8851	706627a9-ef96-49d3-9a32-b59293f71690	PROD-MED-M14	SKU-MED-M14	Cetirizine	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.951	2026-04-09 10:52:46.951	cdf427a7-bf4d-478e-97e7-7f24c214f584
ca74b873-88c1-4952-915b-0ffe9974b94a	28ae20d7-97d3-4f14-a9ac-57096209cc66	PROD-MED-M15	SKU-MED-M15	Lorastine	Antihistamin non-sedatif untuk alergi kronis	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.955	2026-04-09 10:52:46.955	cdf427a7-bf4d-478e-97e7-7f24c214f584
e21c4bc8-85c3-4b1b-ac05-7b4c5b608942	01f410d4-b32f-47df-8162-4838e39008ad	PROD-MED-M16	SKU-MED-M16	CTM	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.96	2026-04-09 10:52:46.96	cdf427a7-bf4d-478e-97e7-7f24c214f584
d84f6f86-4b03-4130-b454-320130e60866	70b1b27a-75c2-4cf9-9c68-af19a95c2e67	PROD-MED-M17	SKU-MED-M17	Dextamine	Kortikosteroid untuk peradangan berat dan alergi berat	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.964	2026-04-09 10:52:46.964	cdf427a7-bf4d-478e-97e7-7f24c214f584
f8d1ea0e-c1d3-4e81-bf10-58e5b45b9d64	84acf95b-4bf2-4f94-94d9-4e8b324e3d43	PROD-MED-M18	SKU-MED-M18	Glucolin	Sumber energi cepat untuk pasien lemas atau dehidrasi	Syrup	Box	Syrup	Syrup	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.967	2026-04-09 10:52:46.967	cdf427a7-bf4d-478e-97e7-7f24c214f584
f6db5942-4293-410b-a743-10d6b70ed0e7	97281480-2666-4ca7-801a-20659e62c800	PROD-MED-M19	SKU-MED-M19	Enervon-C	Multivitamin untuk daya tahan tubuh dan pemulihan	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.971	2026-04-09 10:52:46.971	cdf427a7-bf4d-478e-97e7-7f24c214f584
7c018127-da9b-4b86-b1fd-41acb4868ddd	f0e09ddf-2075-4e37-84c4-5a71a35079bc	PROD-MED-M20	SKU-MED-M20	Sangobion	Mengatasi anemia (kekurangan darah)	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.974	2026-04-09 10:52:46.974	cdf427a7-bf4d-478e-97e7-7f24c214f584
88d5437d-c06d-4260-9d23-86cf0de3a4d4	03e409ad-27f5-4c5f-aabf-1274503d6f71	PROD-MED-M21	SKU-MED-M21	Diapet	Mengatasi diare akut dan kronis	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.977	2026-04-09 10:52:46.977	cdf427a7-bf4d-478e-97e7-7f24c214f584
cd85c610-b6da-4ffa-bc78-595e5c5dc0c2	3a2be611-ef87-4247-9ce8-e9d0bd54046b	PROD-MED-M22	SKU-MED-M22	New Diatabs	Menghentikan diare akut dengan mengurangi pergerakan usus	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.982	2026-04-09 10:52:46.982	cdf427a7-bf4d-478e-97e7-7f24c214f584
5d1e4a7d-43a9-4294-8530-95a4ade8c17d	16ce8392-3832-43e6-9552-a73a336773bd	PROD-MED-M23	SKU-MED-M23	Bisolvon	Mengencerkan dahak pada batuk berdahak	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.985	2026-04-09 10:52:46.985	cdf427a7-bf4d-478e-97e7-7f24c214f584
403bcc22-c276-4e29-a6d0-a7e5d2b3ab37	a0789ef3-5835-4a30-aecc-8041d423bd8f	PROD-MED-M24	SKU-MED-M24	Flutamol	Antidepresan untuk depresi, OCD, dan bulimia	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.989	2026-04-09 10:52:46.989	cdf427a7-bf4d-478e-97e7-7f24c214f584
e6540067-c94a-463b-9882-81414f3c2180	9f227231-3c7f-4f90-904f-bc16e6bd0b49	PROD-MED-M25	SKU-MED-M25	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.992	2026-04-09 10:52:46.992	cdf427a7-bf4d-478e-97e7-7f24c214f584
e75c667c-0425-4595-a02b-ac4d20841b4b	9ee48a88-b7c3-49c7-88c0-0f948c2db924	PROD-MED-M26	SKU-MED-M26	Betadine	Antiseptik untuk luka dan persiapan operasi	Solution (Topical)	Box	Solution (Topical)	Solution (Topical)	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.995	2026-04-09 10:52:46.995	cdf427a7-bf4d-478e-97e7-7f24c214f584
9f1b0f20-3cf0-4bc7-8f31-a42e8b3a8caa	93545dcc-a7a3-464c-9297-332552d4b568	PROD-MED-M27	SKU-MED-M27	Kalpanax	Obat penenang untuk kecemasan berat dan relaksasi otot	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:46.999	2026-04-09 10:52:46.999	cdf427a7-bf4d-478e-97e7-7f24c214f584
efa0c593-08ff-4bb8-b1f7-ce875dfe2eea	e0407983-d5d5-4a58-afd2-75dbf7643846	PROD-MED-M28	SKU-MED-M28	Nifedipine	Antihipertensi untuk tekanan darah tinggi	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.002	2026-04-09 10:52:47.002	cdf427a7-bf4d-478e-97e7-7f24c214f584
1fa98093-65fa-47c1-99e1-3367893fdfa3	592980a4-bcd2-4d7d-92d3-c95daf5c4cef	PROD-MED-M29	SKU-MED-M29	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.005	2026-04-09 10:52:47.005	cdf427a7-bf4d-478e-97e7-7f24c214f584
15e8ffbc-664c-4414-9bc5-56acac577e2f	aaa9b009-f0a4-4e7c-b4be-3ac8e4a0e048	PROD-MED-M30	SKU-MED-M30	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.008	2026-04-09 10:52:47.008	cdf427a7-bf4d-478e-97e7-7f24c214f584
bf375cb0-f4e1-456f-80ed-25bf7a2dacb9	f9f16067-1467-4dcd-8c3a-a83694f3b1c8	PROD-MED-M31	SKU-MED-M31	Metformin	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.01	2026-04-09 10:52:47.01	cdf427a7-bf4d-478e-97e7-7f24c214f584
71ec329b-d32d-4994-9761-6b7ef5df6828	ab19eccd-5d4d-4077-b7bd-0b2b3242b0fd	PROD-MED-M32	SKU-MED-M32	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.013	2026-04-09 10:52:47.013	cdf427a7-bf4d-478e-97e7-7f24c214f584
01903eca-887b-46af-97b6-71a21252bb42	13fc7b7b-a477-42c5-8d26-d73f232a2f32	PROD-MED-M33	SKU-MED-M33	Allopurinol	Mencegah serangan asam urat (gout)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.017	2026-04-09 10:52:47.017	cdf427a7-bf4d-478e-97e7-7f24c214f584
41f02a6e-bf5e-453d-a4fb-8d80bbe2973f	84fc9a75-e499-4ffb-bd84-fd6fb5027d61	PROD-MED-M34	SKU-MED-M34	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	Capsule	Box	Capsule	Capsule	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.02	2026-04-09 10:52:47.02	cdf427a7-bf4d-478e-97e7-7f24c214f584
2affac06-e34e-41c6-939d-499a46f4398e	6f8a796d-f617-4563-a9f2-2b2c5e5471a4	PROD-MED-M35	SKU-MED-M35	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.023	2026-04-09 10:52:47.023	cdf427a7-bf4d-478e-97e7-7f24c214f584
4c3a1096-4259-4dae-b0e9-140f306ef70b	16f41081-7cd8-4281-84c6-685c7842f1e8	PROD-MED-M36	SKU-MED-M36	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.026	2026-04-09 10:52:47.026	cdf427a7-bf4d-478e-97e7-7f24c214f584
fbcd2e4c-6b4a-47e4-af32-fd008aeab5ea	1f599b7e-6c26-4e0e-a151-792480acf220	PROD-MED-M37	SKU-MED-M37	Albendazole	Antelmintik spektrum luas untuk cacingan	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.028	2026-04-09 10:52:47.028	cdf427a7-bf4d-478e-97e7-7f24c214f584
686513a6-c154-4704-9ff7-457099513ece	739d5f70-8959-4c81-b5b9-a7931192ecc6	PROD-MED-M38	SKU-MED-M38	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.032	2026-04-09 10:52:47.032	cdf427a7-bf4d-478e-97e7-7f24c214f584
a0e37105-bbb4-4f0d-94bb-4b6c66fc4238	f2db7d84-e5cd-4d62-8997-b56f234724f8	PROD-MED-M39	SKU-MED-M39	Warfarin	Antikoagulan untuk mencegah pembekuan darah	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.036	2026-04-09 10:52:47.036	cdf427a7-bf4d-478e-97e7-7f24c214f584
ab98164f-a09b-4725-b057-ea72e951288f	e53a1910-e1d3-4d71-970a-f719ad95d611	PROD-MED-M40	SKU-MED-M40	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.039	2026-04-09 10:52:47.039	cdf427a7-bf4d-478e-97e7-7f24c214f584
5987b968-b774-4e3f-914d-b47cd20a8b5f	186eb9d0-e4be-4f4d-bd30-da95fec0dd94	PROD-MED-M41	SKU-MED-M41	Furosemide	Diuretik kuat untuk edema dan hipertensi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.094	2026-04-09 10:52:47.094	cdf427a7-bf4d-478e-97e7-7f24c214f584
004d92ca-f9c1-47ed-a76a-42844b9f4418	18289cd9-8f87-453e-b88a-e738d18c4e27	PROD-MED-M42	SKU-MED-M42	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.098	2026-04-09 10:52:47.098	cdf427a7-bf4d-478e-97e7-7f24c214f584
6f081988-0c4f-456b-a90b-d77f7fc56361	3e8902e7-793a-4c91-964a-d4bcd85d2428	PROD-MED-M43	SKU-MED-M43	Levothyroxine	Hormon tiroid untuk hipotiroidisme	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.101	2026-04-09 10:52:47.101	cdf427a7-bf4d-478e-97e7-7f24c214f584
b9c8e371-e9aa-49bf-9361-e4b03a28e44b	5cddc85c-aa8d-403e-8020-5a89453c1232	PROD-MED-M44	SKU-MED-M44	Clopidogrel	Antiplatelet untuk mencegah stroke dan serangan jantung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.105	2026-04-09 10:52:47.105	cdf427a7-bf4d-478e-97e7-7f24c214f584
f6cf45a0-822f-4946-9a17-de69ef8093fb	7730d97d-a737-42b1-9513-567ac6ca5229	PROD-MED-M45	SKU-MED-M45	Amlodipine	Antihipertensi golongan CCB untuk hipertensi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.108	2026-04-09 10:52:47.108	cdf427a7-bf4d-478e-97e7-7f24c214f584
4b44ca8c-44b2-4967-ab22-bb024d929bac	3f56b07e-ced4-493b-b3f6-e81eb40b3b66	PROD-MED-M46	SKU-MED-M46	Losartan	Antihipertensi golongan ARB untuk hipertensi	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.11	2026-04-09 10:52:47.11	cdf427a7-bf4d-478e-97e7-7f24c214f584
79f90c42-7df4-4b45-884b-1ca043d59e75	3c7f6882-1f68-4df8-8a7d-2909c19c49bf	PROD-MED-M47	SKU-MED-M47	Bisoprolol	Beta-blocker untuk hipertensi dan gagal jantung	Tablet	Box	Tablet	Tablet	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.113	2026-04-09 10:52:47.113	cdf427a7-bf4d-478e-97e7-7f24c214f584
6cdd1ef4-4937-46ea-ba9a-216af9630a72	351b1ef7-0725-4984-bd20-da9498864bcc	PROD-MED-M48	SKU-MED-M48	Insulin NPH	Insulin kerja menengah untuk diabetes melitus	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.117	2026-04-09 10:52:47.117	cdf427a7-bf4d-478e-97e7-7f24c214f584
aea4227c-6221-4910-af43-740ec38718d8	7b1b9aa2-8b0b-4665-acb3-a15ed5df701f	PROD-MED-M49	SKU-MED-M49	Epinephrine	Untuk syok anafilaksis dan henti jantung	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.12	2026-04-09 10:52:47.12	cdf427a7-bf4d-478e-97e7-7f24c214f584
c4fe5ac2-a838-4545-a09a-423478c226dc	df8c48a6-f32a-4fc3-8ed3-49ff67c8dbcc	PROD-MED-M50	SKU-MED-M50	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.123	2026-04-09 10:52:47.123	cdf427a7-bf4d-478e-97e7-7f24c214f584
410c4809-c484-4de8-92e5-63500d4b534b	c2672bbc-c243-455f-8da5-7ed313e9627d	PROD-MED-M51	SKU-MED-M51	Ceftriaxone	Antibiotik suntik spektrum luas untuk infeksi berat	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.126	2026-04-09 10:52:47.126	cdf427a7-bf4d-478e-97e7-7f24c214f584
08378bea-ef3b-47ba-9be7-835bff295afc	d3a55bf9-cfce-44f4-9406-eba7e154646e	PROD-MED-M52	SKU-MED-M52	Gentamicin	Antibiotik aminoglikosida untuk infeksi gram negatif	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.129	2026-04-09 10:52:47.129	cdf427a7-bf4d-478e-97e7-7f24c214f584
bca500dd-d3d9-48e3-803b-3363728ed0b9	328f9548-1776-41b9-bf0e-2e5d4f4016ab	PROD-MED-M53	SKU-MED-M53	Ketorolac	Analgesik kuat untuk nyeri sedang-berat pasca operasi	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.132	2026-04-09 10:52:47.132	cdf427a7-bf4d-478e-97e7-7f24c214f584
3ad01c4d-710b-490b-8949-39c1c46825ff	5ab7d817-6189-4b84-996a-169fb1e83886	PROD-MED-M54	SKU-MED-M54	Ondansetron	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.136	2026-04-09 10:52:47.136	cdf427a7-bf4d-478e-97e7-7f24c214f584
50d0a4c0-aa29-4dd2-8706-8f4bd9586178	4197a8fb-576d-44e4-9083-9ecf22ae2652	PROD-MED-M55	SKU-MED-M55	Dexamethasone	Kortikosteroid untuk inflamasi dan alergi berat	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.139	2026-04-09 10:52:47.139	cdf427a7-bf4d-478e-97e7-7f24c214f584
5ef0e172-ab9b-46ea-9c21-5fecc483ee6d	edc20f90-f930-4e11-98dd-1d83147349ff	PROD-MED-M56	SKU-MED-M56	Paracetamol Infus	Antipiretik untuk demam tinggi pada pasien rawat inap	Injection	Box	Injection	Injection	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.142	2026-04-09 10:52:47.142	cdf427a7-bf4d-478e-97e7-7f24c214f584
15341735-74cd-4148-bf0d-5ccb4639ff9c	d68c711a-bf4b-4c57-b3da-f6363b30251b	PROD-MED-M57	SKU-MED-M57	Ringers Lactate	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	Liquid	Box	Liquid	Liquid	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.145	2026-04-09 10:52:47.145	cdf427a7-bf4d-478e-97e7-7f24c214f584
05818930-f1e3-4973-85e6-b2e911ce7ee6	477786f7-2ff1-4b15-8241-6a0dffbe844e	PROD-MED-M58	SKU-MED-M58	NaCl 0.9%	Cairan infus isotonik untuk dehidrasi	Liquid	Box	Liquid	Liquid	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.148	2026-04-09 10:52:47.148	cdf427a7-bf4d-478e-97e7-7f24c214f584
c057695b-8645-48e8-bc26-c890f29f6c38	dba99ec2-6c81-4e61-82b3-ebe65a3f607a	PROD-MED-M59	SKU-MED-M59	Dextrose 5%	Sumber energi untuk pasien lemas atau hipoglikemia	Liquid	Box	Liquid	Liquid	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.151	2026-04-09 10:52:47.151	cdf427a7-bf4d-478e-97e7-7f24c214f584
96b0779d-02d2-483e-9353-9995140d3b55	d86b2c49-baf6-49b0-8eca-e652ced0d088	PROD-MED-M60	SKU-MED-M60	Hydrocortisone Cream	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	Cream (Topical)	Box	Cream (Topical)	Cream (Topical)	100	20	50	10000	15000	\N	\N	\N	t	2026-04-09 10:52:47.154	2026-04-09 10:52:47.154	cdf427a7-bf4d-478e-97e7-7f24c214f584
064cbc2b-0720-43f6-a320-c3d7fc50ba24	ba8a3c08-f1f6-48d9-94bc-606b6bba5400	PROD-SUP-HANDSCHOEN-LATEX-S	SKU-SUP-HANDSCHOEN-LATEX-S	Handschoen Latex S	\N	Pasang	Box	Pasang	Pasang	50	10	20	2500	5000	\N	\N	\N	t	2026-04-09 10:52:47.158	2026-04-09 10:52:47.158	cdf427a7-bf4d-478e-97e7-7f24c214f584
e550d9de-9e96-4db6-b0c0-e77fe5d77981	8337fa3e-0799-42ca-87b8-fa11d002dd8e	PROD-SUP-HANDSCHOEN-LATEX-M	SKU-SUP-HANDSCHOEN-LATEX-M	Handschoen Latex M	\N	Pasang	Box	Pasang	Pasang	50	10	20	2500	5000	\N	\N	\N	t	2026-04-09 10:52:47.161	2026-04-09 10:52:47.161	cdf427a7-bf4d-478e-97e7-7f24c214f584
56dbc78d-d73c-4341-be11-78c5a6afd8b4	9a248a68-0110-4747-94bb-86bff9d58a97	PROD-SUP-HANDSCHOEN-LATEX-L	SKU-SUP-HANDSCHOEN-LATEX-L	Handschoen Latex L	\N	Pasang	Box	Pasang	Pasang	50	10	20	2500	5000	\N	\N	\N	t	2026-04-09 10:52:47.164	2026-04-09 10:52:47.164	cdf427a7-bf4d-478e-97e7-7f24c214f584
16c0303e-aaf2-47b9-ab76-a74183607212	f0fd9a0f-ff78-421f-9ae1-7fdd4f968b96	PROD-SUP-MASKER-BEDAH-3-PLY	SKU-SUP-MASKER-BEDAH-3-PLY	Masker Bedah 3-Ply	\N	Pcs	Box	Pcs	Pcs	50	10	20	1000	2000	\N	\N	\N	t	2026-04-09 10:52:47.167	2026-04-09 10:52:47.167	cdf427a7-bf4d-478e-97e7-7f24c214f584
9f396fa3-bcdb-44e6-b77b-50ab6cdc968d	dd5f6172-ecb6-4369-95b5-80bfce9da4ad	PROD-SUP-SPUIT-1CC	SKU-SUP-SPUIT-1CC	Spuit 1cc	\N	Pcs	Box	Pcs	Pcs	50	10	20	3000	6000	\N	\N	\N	t	2026-04-09 10:52:47.174	2026-04-09 10:52:47.174	cdf427a7-bf4d-478e-97e7-7f24c214f584
4dc2c9f6-8f27-49d1-b98e-94e1e39ce23a	08508630-9565-4b46-9224-05a5f95c1344	PROD-SUP-SPUIT-3CC	SKU-SUP-SPUIT-3CC	Spuit 3cc	\N	Pcs	Box	Pcs	Pcs	50	10	20	3500	7000	\N	\N	\N	t	2026-04-09 10:52:47.178	2026-04-09 10:52:47.178	cdf427a7-bf4d-478e-97e7-7f24c214f584
7b2bf162-1495-43eb-8ed0-4d308c03ade1	67e472cd-7b20-44f8-a085-d1fa4e7e161c	PROD-SUP-SPUIT-5CC	SKU-SUP-SPUIT-5CC	Spuit 5cc	\N	Pcs	Box	Pcs	Pcs	50	10	20	4000	8000	\N	\N	\N	t	2026-04-09 10:52:47.184	2026-04-09 10:52:47.184	cdf427a7-bf4d-478e-97e7-7f24c214f584
18b5e1c9-ef4b-4dcc-964a-91582cd6e45d	573d06c4-d878-421b-9202-d620c19ee6e6	PROD-SUP-ALCOHOL-SWAB	SKU-SUP-ALCOHOL-SWAB	Alcohol Swab	\N	Pcs	Box	Pcs	Pcs	50	10	20	500	1000	\N	\N	\N	t	2026-04-09 10:52:47.189	2026-04-09 10:52:47.189	cdf427a7-bf4d-478e-97e7-7f24c214f584
06cbaf90-f288-4776-9928-e55df64be6ca	68a067bc-d585-406c-a3dd-40ef7dc38c54	PROD-SUP-ABOCATH-G20-(PINK)	SKU-SUP-ABOCATH-G20-(PINK)	Abocath G20 (Pink)	\N	Pcs	Box	Pcs	Pcs	50	10	20	15000	25000	\N	\N	\N	t	2026-04-09 10:52:47.194	2026-04-09 10:52:47.194	cdf427a7-bf4d-478e-97e7-7f24c214f584
5e1c451a-19fb-438d-b3c8-76df69690035	7619e2c0-6b65-4748-abfe-ed9ad147f85e	PROD-SUP-ABOCATH-G22-(BLUE)	SKU-SUP-ABOCATH-G22-(BLUE)	Abocath G22 (Blue)	\N	Pcs	Box	Pcs	Pcs	50	10	20	15000	25000	\N	\N	\N	t	2026-04-09 10:52:47.2	2026-04-09 10:52:47.2	cdf427a7-bf4d-478e-97e7-7f24c214f584
d2d10adb-e7a7-45db-bb33-35db3ebd7202	c7d679a0-671d-4f76-976e-ea4cb1c78dab	PROD-SUP-INFUSION-SET-DEWASA	SKU-SUP-INFUSION-SET-DEWASA	Infusion Set Dewasa	\N	Set	Box	Set	Set	50	10	20	20000	35000	\N	\N	\N	t	2026-04-09 10:52:47.205	2026-04-09 10:52:47.205	cdf427a7-bf4d-478e-97e7-7f24c214f584
084a9c0f-dab4-4e66-9a90-12e16e0c1966	8cea249e-d37b-4161-a4ee-98be2ca2c208	PROD-SUP-INFUSION-SET-ANAK	SKU-SUP-INFUSION-SET-ANAK	Infusion Set Anak	\N	Set	Box	Set	Set	50	10	20	22000	38000	\N	\N	\N	t	2026-04-09 10:52:47.208	2026-04-09 10:52:47.208	cdf427a7-bf4d-478e-97e7-7f24c214f584
805fe17b-b698-456a-9e6a-ba91932fb338	8ce4b0f0-a291-4b7a-a342-7cdfb754f5ba	PROD-SUP-KASA-STERIL-10X10	SKU-SUP-KASA-STERIL-10X10	Kasa Steril 10x10	\N	Box	Box	Box	Box	50	10	20	12000	20000	\N	\N	\N	t	2026-04-09 10:52:47.213	2026-04-09 10:52:47.213	cdf427a7-bf4d-478e-97e7-7f24c214f584
c78758a4-7724-4105-905f-e5539a4e66d9	f591c210-13c3-4877-a435-6d7f4ad4f961	PROD-SUP-MICROPORE-1-INCH	SKU-SUP-MICROPORE-1-INCH	Micropore 1 inch	\N	Roll	Box	Roll	Roll	50	10	20	25000	35000	\N	\N	\N	t	2026-04-09 10:52:47.218	2026-04-09 10:52:47.218	cdf427a7-bf4d-478e-97e7-7f24c214f584
2291072f-3a3d-427f-a95b-130931cfcbd5	2c47796c-b40f-4acf-b09b-68f88777a304	PROD-SUP-UNDERPAD	SKU-SUP-UNDERPAD	Underpad	\N	Pcs	Box	Pcs	Pcs	50	10	20	5000	10000	\N	\N	\N	t	2026-04-09 10:52:47.223	2026-04-09 10:52:47.223	cdf427a7-bf4d-478e-97e7-7f24c214f584
3aa2a0cf-3f99-4654-a231-4103af70884c	dfb70d14-5753-4ba8-a870-bf9be4f02419	PROD-SUP-URINAL-BAG	SKU-SUP-URINAL-BAG	Urinal Bag	\N	Pcs	Box	Pcs	Pcs	50	10	20	12000	20000	\N	\N	\N	t	2026-04-09 10:52:47.226	2026-04-09 10:52:47.226	cdf427a7-bf4d-478e-97e7-7f24c214f584
ca617b97-7454-4269-8ee3-3eec2733179e	efbc81ad-ba3e-48cd-b934-e4459f54d21c	PROD-SUP-VERBAND-GULUNG-10CM	SKU-SUP-VERBAND-GULUNG-10CM	Verband Gulung 10cm	\N	Roll	Box	Roll	Roll	50	10	20	3000	5000	\N	\N	\N	t	2026-04-09 10:52:47.229	2026-04-09 10:52:47.229	cdf427a7-bf4d-478e-97e7-7f24c214f584
5bba38b2-75f9-43d0-b2b1-621b1e85ebad	1d3b6da1-4c9b-40a6-bf37-57749533389d	PROD-SUP-BETADINE-1-LITER	SKU-SUP-BETADINE-1-LITER	Betadine 1 Liter	\N	Bottle	Box	Bottle	Bottle	50	10	20	150000	180000	\N	\N	\N	t	2026-04-09 10:52:47.232	2026-04-09 10:52:47.232	cdf427a7-bf4d-478e-97e7-7f24c214f584
bf0d465e-ad7b-43e6-84d5-699bf83fdde4	fac61ec2-1f9c-4523-8886-fd503c621776	PROD-SUP-ASEPTIC-GEL-500ML	SKU-SUP-ASEPTIC-GEL-500ML	Aseptic Gel 500ml	\N	Bottle	Box	Bottle	Bottle	50	10	20	35000	50000	\N	\N	\N	t	2026-04-09 10:52:47.236	2026-04-09 10:52:47.236	cdf427a7-bf4d-478e-97e7-7f24c214f584
f0726cbc-c5c7-49c8-9def-372b4f29a112	5bdce515-de02-4abd-b334-03fe5c55d78c	PROD-ALKES-TERMOMETER-DIGITAL	SKU-ALKES-TERMOMETER-DIGITAL	Termometer Digital	\N	Unit	Unit	Unit	Unit	5	2	3	35000	65000	\N	\N	\N	t	2026-04-09 10:52:47.239	2026-04-09 10:52:47.239	cdf427a7-bf4d-478e-97e7-7f24c214f584
d0a79b1e-332b-41fa-ae65-1fbea34dd2d8	fb7875da-2b84-49b0-9bbe-421992a1e638	PROD-ALKES-OXIMETER-FINGERTIP	SKU-ALKES-OXIMETER-FINGERTIP	Oximeter Fingertip	\N	Unit	Unit	Unit	Unit	5	2	3	120000	185000	\N	\N	\N	t	2026-04-09 10:52:47.242	2026-04-09 10:52:47.242	cdf427a7-bf4d-478e-97e7-7f24c214f584
ba618ef2-ba21-4498-9215-705230dbd3a4	e5007c93-22d3-4681-a77a-7230dcde33fd	PROD-ALKES-TENSIMETER-DIGITAL-OMRON	SKU-ALKES-TENSIMETER-DIGITAL-OMRON	Tensimeter Digital Omron	\N	Unit	Unit	Unit	Unit	5	2	3	650000	850000	\N	\N	\N	t	2026-04-09 10:52:47.245	2026-04-09 10:52:47.245	cdf427a7-bf4d-478e-97e7-7f24c214f584
4765acdd-3f9e-4d53-9a48-12166156bcd8	3e4ae42e-41ab-4f27-8d21-996bb3cfaf34	PROD-ALKES-TENSIMETER-ANEROID-(MANUAL)	SKU-ALKES-TENSIMETER-ANEROID-(MANUAL)	Tensimeter Aneroid (Manual)	\N	Unit	Unit	Unit	Unit	5	2	3	180000	250000	\N	\N	\N	t	2026-04-09 10:52:47.247	2026-04-09 10:52:47.247	cdf427a7-bf4d-478e-97e7-7f24c214f584
582fe0d2-667f-41c7-8316-266e3c2f923f	216b9a59-928d-4214-ac0a-1768b5916746	PROD-ALKES-STETOSKOP-LITTMANN-STYLE	SKU-ALKES-STETOSKOP-LITTMANN-STYLE	Stetoskop Littmann Style	\N	Unit	Unit	Unit	Unit	5	2	3	350000	550000	\N	\N	\N	t	2026-04-09 10:52:47.251	2026-04-09 10:52:47.251	cdf427a7-bf4d-478e-97e7-7f24c214f584
ec9846b0-a3f1-481e-88b0-6ec34382eb2c	c8b053a8-a408-4300-846e-15b3abcbd3a6	PROD-ALKES-GLUCO-CHECK-KIT	SKU-ALKES-GLUCO-CHECK-KIT	Gluco-Check Kit	\N	Set	Unit	Set	Set	5	2	3	250000	350000	\N	\N	\N	t	2026-04-09 10:52:47.254	2026-04-09 10:52:47.254	cdf427a7-bf4d-478e-97e7-7f24c214f584
8ef85abe-6b7e-40af-91fc-807fd6fd5760	9bf7c21d-b497-4a33-a7a7-0f8b250afb2d	PROD-ALKES-NEBULIZER-MACHINE-PORTABLE	SKU-ALKES-NEBULIZER-MACHINE-PORTABLE	Nebulizer Machine Portable	\N	Unit	Unit	Unit	Unit	5	2	3	450000	650000	\N	\N	\N	t	2026-04-09 10:52:47.256	2026-04-09 10:52:47.256	cdf427a7-bf4d-478e-97e7-7f24c214f584
466426b4-0cf8-4b87-b6c3-0e60089cdce8	3381e8b7-f45e-4452-b9b9-998bc0a4c4b3	PROD-ALKES-TABUNG-OKSIGEN-1M3-(SET)	SKU-ALKES-TABUNG-OKSIGEN-1M3-(SET)	Tabung Oksigen 1m3 (Set)	\N	Set	Unit	Set	Set	5	2	3	950000	1250000	\N	\N	\N	t	2026-04-09 10:52:47.259	2026-04-09 10:52:47.259	cdf427a7-bf4d-478e-97e7-7f24c214f584
75ab2c42-d07a-4623-a455-33d4d1b08f37	86e78c6d-d491-4fa7-bd58-4dabbe7f281e	PROD-ALKES-TERMOMETER-INFRARED-(GUN)	SKU-ALKES-TERMOMETER-INFRARED-(GUN)	Termometer Infrared (Gun)	\N	Unit	Unit	Unit	Unit	5	2	3	150000	250000	\N	\N	\N	t	2026-04-09 10:52:47.262	2026-04-09 10:52:47.262	cdf427a7-bf4d-478e-97e7-7f24c214f584
5c5f080b-cedc-4350-b706-c254a050be9e	703eb43b-e56f-4c46-b016-b4ba0db057bc	AS-MED-USG4D-K001-PC	AS-MED-USG4D-K001-SKU	USG 4D Mindray DC-70	\N	Unit	Unit	Unit	Unit	1	0	0	750000000	0	\N	\N	\N	t	2026-04-09 10:52:47.265	2026-04-09 10:52:47.265	cdf427a7-bf4d-478e-97e7-7f24c214f584
e5ab56f7-76b1-4d15-94fd-db943098e51d	31623348-a15c-4ebb-a96a-80000326fe1b	AS-MED-ECG-K001-PC	AS-MED-ECG-K001-SKU	ECG 12-Channel GE MAC 2000	\N	Unit	Unit	Unit	Unit	1	0	0	450000000	0	\N	\N	\N	t	2026-04-09 10:52:47.268	2026-04-09 10:52:47.268	cdf427a7-bf4d-478e-97e7-7f24c214f584
846113ec-2187-445d-84d1-e16fa8d572f0	ffeb3b0e-ac3f-4d8e-b9c8-859d5681bc26	AS-MED-DENTAL-K001-PC	AS-MED-DENTAL-K001-SKU	Dental Chair Unit Anthos A3	\N	Unit	Unit	Unit	Unit	1	0	0	135000000	0	\N	\N	\N	t	2026-04-09 10:52:47.271	2026-04-09 10:52:47.271	cdf427a7-bf4d-478e-97e7-7f24c214f584
e5152976-c6b6-44a1-a15d-4615d1f34e1f	bd5d718e-275a-49bb-abb2-ed13e3516a8f	AS-MED-AUTO-K001-PC	AS-MED-AUTO-K001-SKU	Autoclave Getinge HS33	\N	Unit	Unit	Unit	Unit	1	0	0	95000000	0	\N	\N	\N	t	2026-04-09 10:52:47.274	2026-04-09 10:52:47.274	cdf427a7-bf4d-478e-97e7-7f24c214f584
4e8d9cd3-98ae-42f5-803a-2badb8dfdda9	346f29fa-5cdb-4009-b835-598252be9652	AS-VEH-AMB-K001-PC	AS-VEH-AMB-K001-SKU	Ambulance Toyota Hiace Medis (Advance)	\N	Unit	Unit	Unit	Unit	1	0	0	680000000	0	\N	\N	\N	t	2026-04-09 10:52:47.276	2026-04-09 10:52:47.276	cdf427a7-bf4d-478e-97e7-7f24c214f584
aadea136-cce6-44e3-8b77-d69e46bb2c84	ff6ca215-d3ad-4bbd-8619-97b8470576d3	AS-FAC-AC-INV-K001-PC	AS-FAC-AC-INV-K001-SKU	AC Daikin Multi-S 3 Connection	\N	Unit	Unit	Unit	Unit	1	0	0	18000000	0	\N	\N	\N	t	2026-04-09 10:52:47.279	2026-04-09 10:52:47.279	cdf427a7-bf4d-478e-97e7-7f24c214f584
5dd42cff-03fa-4301-9a70-b7b6077442de	2c757cee-ead0-4c02-96c8-26543453a927	AS-OFF-IMAC-K001-PC	AS-OFF-IMAC-K001-SKU	iMac 24" M3 16GB/512GB (Reception)	\N	Unit	Unit	Unit	Unit	1	0	0	28500000	0	\N	\N	\N	t	2026-04-09 10:52:47.283	2026-04-09 10:52:47.283	cdf427a7-bf4d-478e-97e7-7f24c214f584
b57938b7-c927-4657-8f7d-5edc474ef4e1	b9f99ff6-ea86-4a46-837a-0b8a80b3dc2c	AS-OFF-AERON-K001-PC	AS-OFF-AERON-K001-SKU	Herman Miller Aeron Chair	\N	Unit	Unit	Unit	Unit	1	0	0	24000000	0	\N	\N	\N	t	2026-04-09 10:52:47.286	2026-04-09 10:52:47.286	cdf427a7-bf4d-478e-97e7-7f24c214f584
f6f3e829-730e-4c51-a328-c6b4139db99b	2b6e14b9-c571-41c8-aa6a-8ccf998c7369	AS-LAB-HEM-K001-PC	AS-LAB-HEM-K001-SKU	Hematology Analyzer Sysmex XN-350	\N	Unit	Unit	Unit	Unit	1	0	0	210000000	0	\N	\N	\N	t	2026-04-09 10:52:47.289	2026-04-09 10:52:47.289	cdf427a7-bf4d-478e-97e7-7f24c214f584
9ae872f2-666e-4fe5-bd27-eba505617cd4	15443f10-60e0-4a71-8a73-be6790bac169	AS-FAC-TV75-K001-PC	AS-FAC-TV75-K001-SKU	Smart TV Samsung 75" Neo QLED	\N	Unit	Unit	Unit	Unit	1	0	0	35000000	0	\N	\N	\N	t	2026-04-09 10:52:47.291	2026-04-09 10:52:47.291	cdf427a7-bf4d-478e-97e7-7f24c214f584
e05f0bfa-e628-4249-8c16-edf0c14286b1	703eb43b-e56f-4c46-b016-b4ba0db057bc	AS-MED-USG4D-K002-PC	AS-MED-USG4D-K002-SKU	USG 4D Mindray DC-70	\N	Unit	Unit	Unit	Unit	1	0	0	750000000	0	\N	\N	\N	t	2026-04-09 10:52:47.293	2026-04-09 10:52:47.293	cdf427a7-bf4d-478e-97e7-7f24c214f584
15cbfe76-e5de-4c12-83e3-d60bf16bc5f5	ffeb3b0e-ac3f-4d8e-b9c8-859d5681bc26	AS-MED-DENTAL-K002-PC	AS-MED-DENTAL-K002-SKU	Dental Chair Unit Anthos A3	\N	Unit	Unit	Unit	Unit	1	0	0	135000000	0	\N	\N	\N	t	2026-04-09 10:52:47.295	2026-04-09 10:52:47.295	cdf427a7-bf4d-478e-97e7-7f24c214f584
48cdb421-9d25-4434-893a-bceb616a5738	bd5d718e-275a-49bb-abb2-ed13e3516a8f	AS-MED-AUTO-K002-PC	AS-MED-AUTO-K002-SKU	Autoclave Getinge HS33	\N	Unit	Unit	Unit	Unit	1	0	0	95000000	0	\N	\N	\N	t	2026-04-09 10:52:47.297	2026-04-09 10:52:47.297	cdf427a7-bf4d-478e-97e7-7f24c214f584
12fa24b6-fbd2-438d-b7a4-ef9d0183de75	346f29fa-5cdb-4009-b835-598252be9652	AS-VEH-AMB-K002-PC	AS-VEH-AMB-K002-SKU	Ambulance Toyota Hiace Medis (Advance)	\N	Unit	Unit	Unit	Unit	1	0	0	680000000	0	\N	\N	\N	t	2026-04-09 10:52:47.3	2026-04-09 10:52:47.3	cdf427a7-bf4d-478e-97e7-7f24c214f584
0e30c182-f332-43f0-bae2-088154b2de8e	ff6ca215-d3ad-4bbd-8619-97b8470576d3	AS-FAC-AC-INV-K002-PC	AS-FAC-AC-INV-K002-SKU	AC Daikin Multi-S 3 Connection	\N	Unit	Unit	Unit	Unit	1	0	0	18000000	0	\N	\N	\N	t	2026-04-09 10:52:47.303	2026-04-09 10:52:47.303	cdf427a7-bf4d-478e-97e7-7f24c214f584
edcfdb33-ee82-47b5-848a-7ab0df062596	2c757cee-ead0-4c02-96c8-26543453a927	AS-OFF-IMAC-K002-PC	AS-OFF-IMAC-K002-SKU	iMac 24" M3 16GB/512GB (Reception)	\N	Unit	Unit	Unit	Unit	1	0	0	28500000	0	\N	\N	\N	t	2026-04-09 10:52:47.305	2026-04-09 10:52:47.305	cdf427a7-bf4d-478e-97e7-7f24c214f584
717d58c9-e32f-43eb-a478-793af569ce9b	b9f99ff6-ea86-4a46-837a-0b8a80b3dc2c	AS-OFF-AERON-K002-PC	AS-OFF-AERON-K002-SKU	Herman Miller Aeron Chair	\N	Unit	Unit	Unit	Unit	1	0	0	24000000	0	\N	\N	\N	t	2026-04-09 10:52:47.307	2026-04-09 10:52:47.307	cdf427a7-bf4d-478e-97e7-7f24c214f584
5b365e16-249e-4336-8ca3-faa3db066a1d	2b6e14b9-c571-41c8-aa6a-8ccf998c7369	AS-LAB-HEM-K002-PC	AS-LAB-HEM-K002-SKU	Hematology Analyzer Sysmex XN-350	\N	Unit	Unit	Unit	Unit	1	0	0	210000000	0	\N	\N	\N	t	2026-04-09 10:52:47.31	2026-04-09 10:52:47.31	cdf427a7-bf4d-478e-97e7-7f24c214f584
feb83279-9ef0-4af5-a229-6c13dacd6fe7	15443f10-60e0-4a71-8a73-be6790bac169	AS-FAC-TV75-K002-PC	AS-FAC-TV75-K002-SKU	Smart TV Samsung 75" Neo QLED	\N	Unit	Unit	Unit	Unit	1	0	0	35000000	0	\N	\N	\N	t	2026-04-09 10:52:47.312	2026-04-09 10:52:47.312	cdf427a7-bf4d-478e-97e7-7f24c214f584
3bb59420-6d27-4df6-862e-82e06cc01f1b	6067dd34-b594-4618-8a29-047780093f1f	AS-IT-SVR-K002-PC	AS-IT-SVR-K002-SKU	Server NAS Synology DS923+	\N	Unit	Unit	Unit	Unit	1	0	0	15500000	0	\N	\N	\N	t	2026-04-09 10:52:47.354	2026-04-09 10:52:47.354	cdf427a7-bf4d-478e-97e7-7f24c214f584
40edfb9f-6243-49a0-b768-eb8179247ca1	3d89e205-0169-4849-98fc-0c82a3999391	AS-IT-WIFI-K002-PC	AS-IT-WIFI-K002-SKU	Ubiquiti UniFi Dream Machine Pro (WiFi System)	\N	Unit	Unit	Unit	Unit	1	0	0	9500000	0	\N	\N	\N	t	2026-04-09 10:52:47.357	2026-04-09 10:52:47.357	cdf427a7-bf4d-478e-97e7-7f24c214f584
111e301f-847d-4ee2-b78b-373f125ef52a	600175dd-40be-45b9-b84a-daea3fddeafc	AS-IT-LP1-K002-PC	AS-IT-LP1-K002-SKU	Laptop MacBook Air 13" M3 16GB (Manajemen)	\N	Unit	Unit	Unit	Unit	1	0	0	21500000	0	\N	\N	\N	t	2026-04-09 10:52:47.359	2026-04-09 10:52:47.359	cdf427a7-bf4d-478e-97e7-7f24c214f584
639fc234-e009-4067-848b-92b4c1d278ae	ee38f03d-915d-4e20-a378-2ad56978fb52	AS-IT-PC1-K002-PC	AS-IT-PC1-K002-SKU	PC Desktop Dell Optiplex 7010 (Admin Set)	\N	Unit	Unit	Unit	Unit	1	0	0	12500000	0	\N	\N	\N	t	2026-04-09 10:52:47.361	2026-04-09 10:52:47.361	cdf427a7-bf4d-478e-97e7-7f24c214f584
fd951927-6bee-4433-a53b-b1693d984b6c	808da982-f94f-4964-8620-9190d365741f	AS-IT-PRN-K002-PC	AS-IT-PRN-K002-SKU	Printer Epson L3210 (Multifunction)	\N	Unit	Unit	Unit	Unit	1	0	0	3200000	0	\N	\N	\N	t	2026-04-09 10:52:47.364	2026-04-09 10:52:47.364	cdf427a7-bf4d-478e-97e7-7f24c214f584
cea0e5c0-adf3-40aa-9d12-5b5a50fdc652	5bdf74e6-be7c-4468-8744-5d8a7232e611	AS-VEH-CAR-K002-PC	AS-VEH-CAR-K002-SKU	Mobil Operasional Toyota Avanza Veloz	\N	Unit	Unit	Unit	Unit	1	0	0	295000000	0	\N	\N	\N	t	2026-04-09 10:52:47.367	2026-04-09 10:52:47.367	cdf427a7-bf4d-478e-97e7-7f24c214f584
f4acc1ff-3dd9-48b4-b90c-01a69308198f	fee316ab-bb0d-43e3-9272-429eea6d00c8	AS-VEH-MTR2-K002-PC	AS-VEH-MTR2-K002-SKU	Motor Operasional Yamaha NMAX 155	\N	Unit	Unit	Unit	Unit	1	0	0	35000000	0	\N	\N	\N	t	2026-04-09 10:52:47.369	2026-04-09 10:52:47.369	cdf427a7-bf4d-478e-97e7-7f24c214f584
f8361570-1d3b-4233-a503-4c9ba27af3d5	530c4626-563f-447e-9f24-8b80506ab645	AS-FAC-CCTV-K002-PC	AS-FAC-CCTV-K002-SKU	CCTV System Hikvision 8-CH (Full HD)	\N	Unit	Unit	Unit	Unit	1	0	0	8500000	0	\N	\N	\N	t	2026-04-09 10:52:47.372	2026-04-09 10:52:47.372	cdf427a7-bf4d-478e-97e7-7f24c214f584
d8993914-27bc-40b8-bd8d-2c2c5b5ee447	0428b1c9-571b-484d-b208-f8cf70f13d49	AS-FAC-ABS-K002-PC	AS-FAC-ABS-K002-SKU	Mesin Absensi Face Recognition (Solution)	\N	Unit	Unit	Unit	Unit	1	0	0	4500000	0	\N	\N	\N	t	2026-04-09 10:52:47.375	2026-04-09 10:52:47.375	cdf427a7-bf4d-478e-97e7-7f24c214f584
a0d6e2d5-4d75-4cca-8076-969e61ea1b52	6f9eb70f-597d-4acb-b051-65add8a644dc	AS-IT-WIFI-K001-PC	AS-IT-WIFI-K001-SKU	Ubiquiti UniFi Dream Machine Pro (WiFi System)	\N	Unit	Unit	Unit	Unit	1	0	0	9500000	0	\N	\N	\N	t	2026-04-09 10:52:47.319	2026-04-09 11:02:26.602	cdf427a7-bf4d-478e-97e7-7f24c214f584
f179617c-e56a-4195-8ff6-be396262c4fe	8820e22b-4db9-444a-858c-97cf27e64900	AS-IT-LP1-K001-PC	AS-IT-LP1-K001-SKU	Laptop MacBook Air 13" M3 16GB (Manajemen)	\N	Unit	Unit	Unit	Unit	1	0	0	21500000	0	\N	\N	\N	t	2026-04-09 10:52:47.322	2026-04-09 11:02:26.609	cdf427a7-bf4d-478e-97e7-7f24c214f584
d6e15f45-d818-4176-9aea-f28fc0cb6dc9	5f63d138-9478-4fe1-83a3-9f673cf850b7	AS-IT-PC1-K001-PC	AS-IT-PC1-K001-SKU	PC Desktop Dell Optiplex 7010 (Admin Set)	\N	Unit	Unit	Unit	Unit	1	0	0	12500000	0	\N	\N	\N	t	2026-04-09 10:52:47.325	2026-04-09 11:02:26.616	cdf427a7-bf4d-478e-97e7-7f24c214f584
30b4d04a-7601-4c71-96c5-f24649f27b12	285a8d39-323c-4e82-a0c6-cc90d126ef61	AS-IT-PRN-K001-PC	AS-IT-PRN-K001-SKU	Printer Epson L3210 (Multifunction)	\N	Unit	Unit	Unit	Unit	1	0	0	3200000	0	\N	\N	\N	t	2026-04-09 10:52:47.328	2026-04-09 11:02:26.623	cdf427a7-bf4d-478e-97e7-7f24c214f584
9755d2b8-faa3-41b3-a136-d3f1ba8cdf32	3b7419c8-d502-45eb-bdc1-e4afe85ffa9f	AS-VEH-CAR-K001-PC	AS-VEH-CAR-K001-SKU	Mobil Operasional Toyota Avanza Veloz	\N	Unit	Unit	Unit	Unit	1	0	0	295000000	0	\N	\N	\N	t	2026-04-09 10:52:47.331	2026-04-09 11:02:26.631	cdf427a7-bf4d-478e-97e7-7f24c214f584
e940a200-9fcb-41cf-9c73-95c35406b347	ea19caa2-4b7e-4776-8578-b99944912668	AS-VEH-MTR2-K001-PC	AS-VEH-MTR2-K001-SKU	Motor Operasional Yamaha NMAX 155	\N	Unit	Unit	Unit	Unit	1	0	0	35000000	0	\N	\N	\N	t	2026-04-09 10:52:47.335	2026-04-09 11:02:26.637	cdf427a7-bf4d-478e-97e7-7f24c214f584
2fd7ad53-d1d2-4b6c-a395-21e76ec476e5	204d9662-77e6-4abb-8861-82ba45be3070	AS-FAC-CCTV-K001-PC	AS-FAC-CCTV-K001-SKU	CCTV System Hikvision 8-CH (Full HD)	\N	Unit	Unit	Unit	Unit	1	0	0	8500000	0	\N	\N	\N	t	2026-04-09 10:52:47.338	2026-04-09 11:02:26.646	cdf427a7-bf4d-478e-97e7-7f24c214f584
fa1789fe-c603-49cc-97f7-10d01d369c59	8920e3a3-4c11-41bc-b926-5ea9f7dbcbc8	AS-FAC-ABS-K001-PC	AS-FAC-ABS-K001-SKU	Mesin Absensi Face Recognition (Solution)	\N	Unit	Unit	Unit	Unit	1	0	0	4500000	0	\N	\N	\N	t	2026-04-09 10:52:47.341	2026-04-09 11:02:26.659	cdf427a7-bf4d-478e-97e7-7f24c214f584
dd7e7f01-033d-4a19-a512-5f1a0c57967f	4bc20ee1-e855-49a4-a5d6-e30ce9453b55	AS-FAC-AC-R1-K001-PC	AS-FAC-AC-R1-K001-SKU	AC Panasonic 1PK Inverter (Ruang Periksa 1)	\N	Unit	Unit	Unit	Unit	1	0	0	6500000	0	\N	\N	\N	t	2026-04-09 10:52:47.344	2026-04-09 11:02:26.669	cdf427a7-bf4d-478e-97e7-7f24c214f584
b1302b9d-305f-4fc2-93a6-ac18dc5f792d	cf7c99b7-a1f2-403a-9539-79ca339dc13b	AS-FAC-AC-R2-K001-PC	AS-FAC-AC-R2-K001-SKU	AC Panasonic 1PK Inverter (Ruang Periksa 2)	\N	Unit	Unit	Unit	Unit	1	0	0	6500000	0	\N	\N	\N	t	2026-04-09 10:52:47.348	2026-04-09 11:02:26.683	cdf427a7-bf4d-478e-97e7-7f24c214f584
e644e8b7-097f-4f1e-b4aa-4dc7549af91e	84bb17c4-e321-4918-a6e9-82b41177393a	AS-FAC-AC-W-K001-PC	AS-FAC-AC-W-K001-SKU	AC Panasonic 2PK Inverter (Ruang Tunggu)	\N	Unit	Unit	Unit	Unit	1	0	0	12500000	0	\N	\N	\N	t	2026-04-09 10:52:47.352	2026-04-09 11:02:26.693	cdf427a7-bf4d-478e-97e7-7f24c214f584
94b2ea51-26ad-452a-8053-7ae60eac9c62	0f1e05e8-0160-4fcd-8a20-67efa08a233c	AS-FAC-AC-R1-K002-PC	AS-FAC-AC-R1-K002-SKU	AC Panasonic 1PK Inverter (Ruang Periksa 1)	\N	Unit	Unit	Unit	Unit	1	0	0	6500000	0	\N	\N	\N	t	2026-04-09 10:52:47.377	2026-04-09 10:52:47.377	cdf427a7-bf4d-478e-97e7-7f24c214f584
d56a9e93-2d9b-499f-b7fa-e48920cccb66	698274e1-0053-490c-9272-0b3e01f17342	AS-FAC-AC-R2-K002-PC	AS-FAC-AC-R2-K002-SKU	AC Panasonic 1PK Inverter (Ruang Periksa 2)	\N	Unit	Unit	Unit	Unit	1	0	0	6500000	0	\N	\N	\N	t	2026-04-09 10:52:47.38	2026-04-09 10:52:47.38	cdf427a7-bf4d-478e-97e7-7f24c214f584
7e2bded8-ada8-4026-bc9f-a59ee275e0cf	ca377b39-5d2c-45e4-b4c5-dc875c5b8732	AS-FAC-AC-W-K002-PC	AS-FAC-AC-W-K002-SKU	AC Panasonic 2PK Inverter (Ruang Tunggu)	\N	Unit	Unit	Unit	Unit	1	0	0	12500000	0	\N	\N	\N	t	2026-04-09 10:52:47.383	2026-04-09 10:52:47.383	cdf427a7-bf4d-478e-97e7-7f24c214f584
f31d503e-09fa-4582-8c3b-ca250417226b	31623348-a15c-4ebb-a96a-80000326fe1b	AS-MED-ECG-K002-PC	AS-MED-ECG-K002-SKU	ECG 12-Channel GE MAC 2000		Unit	Unit	Unit	Unit	1	5	10	450000000	0	\N	\N	\N	t	2026-04-09 10:52:47.385	2026-04-09 10:52:47.385	cdf427a7-bf4d-478e-97e7-7f24c214f584
84cfd6fa-fa32-4ffb-b66f-d8ce2a595dca	a91701e0-4e68-452d-9d62-ebb37db8823d	AS-IT-SVR-K001-PC	AS-IT-SVR-K001-SKU	Server NAS Synology DS923+	\N	Unit	Unit	Unit	Unit	1	0	0	15500000	0	\N	\N	\N	t	2026-04-09 10:52:47.316	2026-04-09 11:02:26.586	cdf427a7-bf4d-478e-97e7-7f24c214f584
069974ec-c263-437c-9d3c-2322d3aa0b44	b18373b2-c7bb-441b-9754-998b2edb2fc4	PRD-K002-GD1745	SKU-K002-1RQ4N	Sanmol	Meredakan demam dan nyeri ringan hingga sedang seperti sakit kepala, sakit gigi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.338	2026-04-10 02:25:51.338	2f33c982-33d9-416b-bb9c-90602896da7d
e512b564-cd8f-4e24-bff7-6db81f3715e6	b1f9ce70-c713-4732-93bb-82d4c0900b2e	PRD-K002-VKZ24B	SKU-K002-Z45X	Bodrex	Meredakan sakit kepala, hidung tersumbat, dan demam akibat flu	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.346	2026-04-10 02:25:51.346	2f33c982-33d9-416b-bb9c-90602896da7d
9008b5af-e1a9-46eb-ba00-bcfc3d9d57c7	a588591a-a27d-4bc9-9044-e1242a89b118	PRD-K002-HIUIYNR	SKU-K002-YY8ZI	Farnox	Antiinflamasi untuk nyeri sendi, otot, dan sakit gigi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.353	2026-04-10 02:25:51.353	2f33c982-33d9-416b-bb9c-90602896da7d
ffb9bab1-48ea-4299-9559-bfad3efa7ed8	2fd56395-160e-4139-bf3d-949f3db46659	PRD-K002-OURSH	SKU-K002-NBOIM7	Ponalac	Nyeri rematik, asam urat, dan nyeri haid	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.358	2026-04-10 02:25:51.358	2f33c982-33d9-416b-bb9c-90602896da7d
2bcce6a0-3a24-4117-8fa0-5012b5699307	30be0f20-7925-4c17-9191-ba575d0374a4	PRD-K002-97TPEC	SKU-K002-QSQ9OJ	Amoxan	Antibiotik untuk infeksi saluran pernapasan, kulit, dan saluran kemih	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.363	2026-04-10 02:25:51.363	2f33c982-33d9-416b-bb9c-90602896da7d
3a106f91-b709-4933-847d-62eeec160ddc	efe0767e-8aa2-414d-98f8-fcfdb21cfc8a	PRD-K002-QBOL2P	SKU-K002-EXHTFT	Ciflos	Antibiotik untuk infeksi saluran kemih dan infeksi saluran cerna	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.369	2026-04-10 02:25:51.369	2f33c982-33d9-416b-bb9c-90602896da7d
ce87aeb7-62a9-4f13-b99e-129425699c47	2567fc39-aac0-407d-9e8c-6d3efeaf1c68	PRD-K002-35PB4	SKU-K002-QMN3N	Kalmethrox	Antibiotik untuk infeksi saluran pernapasan, kulit, dan THT	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.373	2026-04-10 02:25:51.373	2f33c982-33d9-416b-bb9c-90602896da7d
940d97da-5c3e-43d1-8bd6-9f3f1d89cbe1	871431b9-da3d-43c1-bdc2-419274673286	PRD-K002-FCT87G	SKU-K002-GL4UDI	Promag	Mengatasi maag, perut kembung, dan nyeri lambung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.377	2026-04-10 02:25:51.377	2f33c982-33d9-416b-bb9c-90602896da7d
6e0b5e95-c15b-47e4-877f-dba09785daa2	4454c9af-fe3f-4f39-ae01-f50e8cb6a60d	PRD-K002-7QU7LE	SKU-K002-BQQIS	Bio Gastra	Mengurangi produksi asam lambung untuk mengatasi tukak lambung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.381	2026-04-10 02:25:51.381	2f33c982-33d9-416b-bb9c-90602896da7d
b3b26b08-97b0-41ce-8ba4-4078a82288c8	3c6ba828-8591-49e0-9507-46230d2c62d0	PRD-K002-O9O3VK	SKU-K002-9NWHV5	Lasal	Bronkodilator untuk asma dan sesak napas	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.385	2026-04-10 02:25:51.385	2f33c982-33d9-416b-bb9c-90602896da7d
d68ced24-98d3-40a1-9caf-ce2b56cbff56	a6d6bd8d-5c97-4ea6-8b9f-30a3097b5b23	PRD-K002-NLWDC	SKU-K002-N0327E	OBH Combi	Meredakan batuk berdahak dan batuk kering	Syrup	Box	Syrup	Syrup	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.389	2026-04-10 02:25:51.389	2f33c982-33d9-416b-bb9c-90602896da7d
5b55eff4-84b6-4ee2-8aaa-ccc32ee6628f	87dd2ea4-e2a8-4243-9508-db8c7c228dcc	PRD-K002-NFH938	SKU-K002-3LFZMI	Woods	Mengencerkan dahak pada batuk berdahak	Syrup	Box	Syrup	Syrup	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.393	2026-04-10 02:25:51.393	2f33c982-33d9-416b-bb9c-90602896da7d
bb1912cb-966d-40c5-ba5f-7d75aae7760a	073cac70-1baf-4b7a-ac09-68c49f0b0f76	PRD-K002-FCUOSW	SKU-K002-8QCMIL	Antimo	Mencegah dan mengatasi mabuk perjalanan (mual, pusing, muntah)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.398	2026-04-10 02:25:51.398	2f33c982-33d9-416b-bb9c-90602896da7d
078f0bce-4d26-486c-a8a6-bfcd77e67880	cbabaf2a-5586-4141-99bb-c6782cf74b47	PRD-K002-T73DF	SKU-K002-75JB6	Cetirizine	Antihistamin untuk alergi (gatal-gatal, bersin, hidung tersumbat)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.403	2026-04-10 02:25:51.403	2f33c982-33d9-416b-bb9c-90602896da7d
3b98611c-3fef-4cff-a757-899022db252d	d548e8e0-8c70-4d9f-bf55-1016c01b5d33	PRD-K002-1CRBKL	SKU-K002-3LIAOL	Lorastine	Antihistamin non-sedatif untuk alergi kronis	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.407	2026-04-10 02:25:51.407	2f33c982-33d9-416b-bb9c-90602896da7d
3b8c0077-5eb5-4dbc-b83f-daf5e0232da7	1248cebc-70f9-467c-9b29-e1dc2de2b71e	PRD-K002-FJRAO8	SKU-K002-PGTN7	CTM	Antihistamin untuk reaksi alergi akut (gatal, bersin, urtikaria)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.41	2026-04-10 02:25:51.41	2f33c982-33d9-416b-bb9c-90602896da7d
3457610c-18e1-47dd-abee-c70c9b350445	5489aac8-de64-4a95-b391-c008d2e2c401	PRD-K002-98KBIO	SKU-K002-XK4D4S	Dextamine	Kortikosteroid untuk peradangan berat dan alergi berat	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.414	2026-04-10 02:25:51.414	2f33c982-33d9-416b-bb9c-90602896da7d
a91fd3f6-0f0a-471c-b89d-b053777e5dbf	9cb1a9b0-6fa9-4bcc-8207-87ad7f1a8c06	PRD-K002-J4TPX3	SKU-K002-EHYBZH	Glucolin	Sumber energi cepat untuk pasien lemas atau dehidrasi	Syrup	Box	Syrup	Syrup	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.419	2026-04-10 02:25:51.419	2f33c982-33d9-416b-bb9c-90602896da7d
60b81518-0841-4d9a-a061-34121a206fa4	584ca180-a10c-4149-bccc-1481fb4471e5	PRD-K002-E6QBSH	SKU-K002-7MXU9F	Enervon-C	Multivitamin untuk daya tahan tubuh dan pemulihan	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.422	2026-04-10 02:25:51.422	2f33c982-33d9-416b-bb9c-90602896da7d
2bbb2622-6dd4-4b9d-963f-7f22a2a30e67	c53b4e94-b1ad-4d36-acf8-bc6e856d6c1c	PRD-K002-YEE6AB	SKU-K002-L3VHK	Sangobion	Mengatasi anemia (kekurangan darah)	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.426	2026-04-10 02:25:51.426	2f33c982-33d9-416b-bb9c-90602896da7d
6029c827-28fa-4ace-9b2b-73e9bd1bb146	2dbf01a3-e3a4-4e63-aa9a-b073dff32daf	PRD-K002-B1BSVO	SKU-K002-9B5JE3	Diapet	Mengatasi diare akut dan kronis	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.429	2026-04-10 02:25:51.429	2f33c982-33d9-416b-bb9c-90602896da7d
d995de3c-1a5b-4f04-af6f-85cc33c819dd	c8f111a5-d72d-4bb0-89f6-5f608422df6e	PRD-K002-ZMR77H	SKU-K002-PWJP4K	New Diatabs	Menghentikan diare akut dengan mengurangi pergerakan usus	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.433	2026-04-10 02:25:51.433	2f33c982-33d9-416b-bb9c-90602896da7d
4076fe30-3529-4987-b222-05a898c1d49f	886a977d-ae8d-4ce3-9a18-a7630d633496	PRD-K002-OXPR	SKU-K002-CQJQ1	Bisolvon	Mengencerkan dahak pada batuk berdahak	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.437	2026-04-10 02:25:51.437	2f33c982-33d9-416b-bb9c-90602896da7d
b07c91e8-b29a-464f-a72e-54a76a8c70d4	51fda82d-adea-40a1-bd26-e04852c68a55	PRD-K002-GRG9SO	SKU-K002-HGDFZJI	Flutamol	Antidepresan untuk depresi, OCD, dan bulimia	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.44	2026-04-10 02:25:51.44	2f33c982-33d9-416b-bb9c-90602896da7d
8f355df5-fb97-4125-8fec-3d9ce29bbfe5	a142eb01-904e-4e03-b21e-76b811707d06	PRD-K002-5B2GDP	SKU-K002-UZ1B1K	Calcium Lactate	Suplemen kalsium untuk osteoporosis dan tulang keropos	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.443	2026-04-10 02:25:51.443	2f33c982-33d9-416b-bb9c-90602896da7d
240e4ece-e107-4d92-bae9-45d307235653	bcd2b17b-2dd7-4e9d-9cc5-21dc2a410ba6	PRD-K002-4KTXQ	SKU-K002-DKZJM	Betadine	Antiseptik untuk luka dan persiapan operasi	Solution (Topical)	Box	Solution (Topical)	Solution (Topical)	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.446	2026-04-10 02:25:51.446	2f33c982-33d9-416b-bb9c-90602896da7d
899ad48b-f01b-4b4e-ac87-bf14e87c8787	6a837a97-2285-4728-8462-d1dde911a974	PRD-K002-M47X4R	SKU-K002-QMJ06J	Kalpanax	Obat penenang untuk kecemasan berat dan relaksasi otot	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.451	2026-04-10 02:25:51.451	2f33c982-33d9-416b-bb9c-90602896da7d
70b2251c-3742-42fd-82e2-f95fdbcfc900	d12a4285-0c1d-4987-bfd4-4d9fe7db9fe6	PRD-K002-KHQWML	SKU-K002-P6JXA	Nifedipine	Antihipertensi untuk tekanan darah tinggi	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.454	2026-04-10 02:25:51.454	2f33c982-33d9-416b-bb9c-90602896da7d
3c6a5d54-e497-426f-a9ec-24145e18394d	b19b2c2c-d1ec-49bd-abf6-fae54218285b	PRD-K002-3SU18	SKU-K002-65H54P	Captopril	Antihipertensi untuk hipertensi dan gagal jantung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.458	2026-04-10 02:25:51.458	2f33c982-33d9-416b-bb9c-90602896da7d
00e8c589-05e3-4d8f-a8d0-c2e5354394bc	0ed884c6-0df8-4d21-8fc4-0ec46063adba	PRD-K002-I1XR7	SKU-K002-XBF0WH	Glibenclamide	Antidiabetik oral untuk diabetes tipe 2	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.461	2026-04-10 02:25:51.461	2f33c982-33d9-416b-bb9c-90602896da7d
c48fad7c-3a1c-467e-8a6d-8f17cbaf06a1	84342180-17bb-48c1-9c6d-60ddabf66bf7	PRD-K002-IJBPT5	SKU-K002-YNJV3	Metformin	Antidiabetik untuk diabetes tipe 2 (menurunkan gula darah)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.466	2026-04-10 02:25:51.466	2f33c982-33d9-416b-bb9c-90602896da7d
4c5525dd-4108-4eef-8fe8-58f1a30ba05a	34e7bdf2-8b30-42bb-8b7b-4e591934741a	PRD-K002-X0ONYP	SKU-K002-AGQCC	Simvastatin	Menurunkan kolesterol LDL dan trigliserida	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.47	2026-04-10 02:25:51.47	2f33c982-33d9-416b-bb9c-90602896da7d
077e54d8-d5f7-4065-bdae-84f2ba275868	8c95dca7-351f-44f1-8f38-80148dee8c08	PRD-K002-CTZ2I	SKU-K002-NUVHSM	Allopurinol	Mencegah serangan asam urat (gout)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.473	2026-04-10 02:25:51.473	2f33c982-33d9-416b-bb9c-90602896da7d
8530a1de-f8fe-4e58-bf6f-0ab18dad7384	55f77d77-d320-41b7-8d25-20be513df56b	PRD-K002-SUIKTW	SKU-K002-QRJMSI	Omeprazole	Menghambat asam lambung untuk GERD dan tukak lambung	Capsule	Box	Capsule	Capsule	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.476	2026-04-10 02:25:51.476	2f33c982-33d9-416b-bb9c-90602896da7d
40f55165-c341-4249-aa8e-34aee40a43ae	4c2bcd44-db26-4766-a104-d6e3a52958c0	PRD-K002-SATWQ6	SKU-K002-XCEG5	Domperidone	Mengatasi mual dan muntah serta mempercepat pengosongan lambung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.479	2026-04-10 02:25:51.479	2f33c982-33d9-416b-bb9c-90602896da7d
5ce6e845-671f-499d-995a-c2ac5412c1ac	b798dffd-de3e-4a7d-be56-d16c47ada32a	PRD-K002-EJ4ZUD	SKU-K002-B9OST	Mebendazole	Antelmintik untuk cacingan (cacing kremi, tambang, gelang)	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.483	2026-04-10 02:25:51.483	2f33c982-33d9-416b-bb9c-90602896da7d
7d1ad228-38de-41d1-9793-d70503582b3e	7bf75b8a-e6ff-4ddf-ac20-956cbb7b40cc	PRD-K002-7ST6UL	SKU-K002-HVVA3	Albendazole	Antelmintik spektrum luas untuk cacingan	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.487	2026-04-10 02:25:51.487	2f33c982-33d9-416b-bb9c-90602896da7d
8a036408-6f78-4ad4-8a61-88e35282c9b5	4ba25a55-389f-4504-b716-52e8d4c137f7	PRD-K002-UL4EFA	SKU-K002-8QHCK	Methylprednisolone	Kortikosteroid untuk inflamasi berat dan autoimun	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.49	2026-04-10 02:25:51.49	2f33c982-33d9-416b-bb9c-90602896da7d
6d68391a-02c2-4be0-b731-935d93d697bc	e588ed67-96c1-4033-b93b-b09de382c90b	PRD-K002-P3SGV5	SKU-K002-7RMBBE	Warfarin	Antikoagulan untuk mencegah pembekuan darah	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.493	2026-04-10 02:25:51.493	2f33c982-33d9-416b-bb9c-90602896da7d
c99932ba-a34c-4c7c-be33-6f259ee8eb7a	8423eec8-38ae-41d8-8da5-468ec1c38f95	PRD-K002-F2LVMJ	SKU-K002-F5WRHR	Digoxin	Untuk gagal jantung kongestif dan aritmia jantung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.497	2026-04-10 02:25:51.497	2f33c982-33d9-416b-bb9c-90602896da7d
8ad29a32-c335-429a-a11e-8239dcc368c4	3ab652d6-512a-427d-ab18-d816eff4043e	PRD-K002-4KHFHJ	SKU-K002-PS8DJ1	Furosemide	Diuretik kuat untuk edema dan hipertensi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.501	2026-04-10 02:25:51.501	2f33c982-33d9-416b-bb9c-90602896da7d
4062a048-66ba-412f-a4a7-8f0e2a2c0144	cfa89e2e-4cf1-466f-809f-515b3a4ba197	PRD-K002-RCOP9F	SKU-K002-YFKQPE	Spironolactone	Diuretik hemat kalium untuk edema dan hipertensi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.505	2026-04-10 02:25:51.505	2f33c982-33d9-416b-bb9c-90602896da7d
6ac599a8-a823-4b63-9148-4af59898ebb4	435279e3-338f-4953-9373-c8eab74b8d07	PRD-K002-X9BD0I	SKU-K002-2ZI5ID	Levothyroxine	Hormon tiroid untuk hipotiroidisme	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.509	2026-04-10 02:25:51.509	2f33c982-33d9-416b-bb9c-90602896da7d
d24452f4-7fb3-44d8-b853-0451a4c29818	05c439f0-3646-424d-acc5-e3906835ab30	PRD-K002-OTME9	SKU-K002-VZXY5XOG	Clopidogrel	Antiplatelet untuk mencegah stroke dan serangan jantung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.512	2026-04-10 02:25:51.512	2f33c982-33d9-416b-bb9c-90602896da7d
6cb62425-09d3-461e-b9ce-4b58f1fe055d	0f8fb934-5f1b-44a3-be48-5a5feddaec45	PRD-K002-Q4W7BL	SKU-K002-T5GW5S	Amlodipine	Antihipertensi golongan CCB untuk hipertensi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.517	2026-04-10 02:25:51.517	2f33c982-33d9-416b-bb9c-90602896da7d
95e0ae2c-a6f8-4e71-8199-e0962e0460b8	1884783c-a41b-4ffd-80f4-4388913225c3	PRD-K002-IUNUTQ	SKU-K002-36Q8YV	Losartan	Antihipertensi golongan ARB untuk hipertensi	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.521	2026-04-10 02:25:51.521	2f33c982-33d9-416b-bb9c-90602896da7d
270440c7-dab5-440e-bf9c-6bc5ca72788f	6cbdc3c0-ca28-4528-95af-d58298f197c2	PRD-K002-1KO9O	SKU-K002-EOT8X4	Bisoprolol	Beta-blocker untuk hipertensi dan gagal jantung	Tablet	Box	Tablet	Tablet	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.524	2026-04-10 02:25:51.524	2f33c982-33d9-416b-bb9c-90602896da7d
ba1afed4-e194-4ee8-ac54-53d652f662df	6de25f37-b71e-4b7b-9e68-1c167463cd26	PRD-K002-A5WZH	SKU-K002-D5TYUQ	Insulin NPH	Insulin kerja menengah untuk diabetes melitus	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.527	2026-04-10 02:25:51.527	2f33c982-33d9-416b-bb9c-90602896da7d
fd9295a5-fe87-47c3-93bf-b05108cbce11	329937c4-35a0-4f7a-8026-f98fe42a0a57	PRD-K002-3EWCWP	SKU-K002-1S2DDF	Epinephrine	Untuk syok anafilaksis dan henti jantung	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.53	2026-04-10 02:25:51.53	2f33c982-33d9-416b-bb9c-90602896da7d
920e2bd8-5238-4310-b776-77e7dea22a3e	95471f8f-fb10-4a86-a3c2-e83f028966e1	PRD-K002-Z30BQU	SKU-K002-HR3IEJ	Atropine Sulfate	Antispasmodik untuk kolik abdomen dan bradikardia	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.534	2026-04-10 02:25:51.534	2f33c982-33d9-416b-bb9c-90602896da7d
d0e42c96-4708-408f-adcc-780b39a89fb1	dd0e0f9f-e6d0-4546-8464-d07b04fdbec4	PRD-K002-KPV159	SKU-K002-LB834Q	Ceftriaxone	Antibiotik suntik spektrum luas untuk infeksi berat	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.538	2026-04-10 02:25:51.538	2f33c982-33d9-416b-bb9c-90602896da7d
e3ae15e1-a9af-43c9-bd13-128a39e54d04	304c7ba7-075e-451b-b09e-f52eb53e5ac1	PRD-K002-0CRWEN	SKU-K002-JU6ZG	Gentamicin	Antibiotik aminoglikosida untuk infeksi gram negatif	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.541	2026-04-10 02:25:51.541	2f33c982-33d9-416b-bb9c-90602896da7d
bd307bc3-14d0-409e-9ca8-99da06ed7ae0	40755fe0-6dab-4098-8257-0abcce12d93b	PRD-K002-PO07OM	SKU-K002-WWKW03	Ketorolac	Analgesik kuat untuk nyeri sedang-berat pasca operasi	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.544	2026-04-10 02:25:51.544	2f33c982-33d9-416b-bb9c-90602896da7d
be01ca82-7f9d-49ba-a727-13853f7acf36	befdd2cb-ee5e-4586-a1c6-319c6ae516b5	PRD-K002-PWYQ8	SKU-K002-ELV4SJ	Ondansetron	Antiemetik untuk mual-muntah pasca kemoterapi/operasi	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.547	2026-04-10 02:25:51.547	2f33c982-33d9-416b-bb9c-90602896da7d
1a6a72bb-2bd1-4044-b34e-2f94fd64b6c7	f779b2d2-0e4b-4670-b7fe-a2f0419b7a22	PRD-K002-GBFSR	SKU-K002-QBTSHN	Dexamethasone	Kortikosteroid untuk inflamasi dan alergi berat	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.551	2026-04-10 02:25:51.551	2f33c982-33d9-416b-bb9c-90602896da7d
9be26bb1-2597-4a71-a7d6-ae045454bc67	5ad706d6-1996-4115-9bb2-c3b85b94b20d	PRD-K002-6P5W65	SKU-K002-0QZE7H	Paracetamol Infus	Antipiretik untuk demam tinggi pada pasien rawat inap	Injection	Box	Injection	Injection	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.555	2026-04-10 02:25:51.555	2f33c982-33d9-416b-bb9c-90602896da7d
aa3114cf-bd14-4233-a7ae-b7ce6f4103e9	7fb41957-1f95-4482-954a-e4248e715a94	PRD-K002-48R2UJ	SKU-K002-7FIM2N	Ringers Lactate	Cairan infus untuk rehidrasi dan keseimbangan elektrolit	Liquid	Box	Liquid	Liquid	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.558	2026-04-10 02:25:51.558	2f33c982-33d9-416b-bb9c-90602896da7d
d29bfa0a-9c40-465a-acbf-6dda9a3a404a	53b680ad-b941-4900-a0d0-53892b6b4d49	PRD-K002-Z50OH8	SKU-K002-DS8CC	NaCl 0.9%	Cairan infus isotonik untuk dehidrasi	Liquid	Box	Liquid	Liquid	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.561	2026-04-10 02:25:51.561	2f33c982-33d9-416b-bb9c-90602896da7d
bdbd83c7-03f8-4dc9-bf39-397013f9cf13	2b82182e-95cc-4fbb-9ebf-68d5c534fd59	PRD-K002-QJFKXZ	SKU-K002-JS5HD9	Dextrose 5%	Sumber energi untuk pasien lemas atau hipoglikemia	Liquid	Box	Liquid	Liquid	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.564	2026-04-10 02:25:51.564	2f33c982-33d9-416b-bb9c-90602896da7d
71c9b2df-642c-4330-8a69-5c452cf5daa9	37374063-6c0b-47b1-84f0-17d667810f86	PRD-K002-6X578P	SKU-K002-72A8VL	Hydrocortisone Cream	Krim antiinflamasi untuk dermatitis, eksim, dan alergi kulit	Cream (Topical)	Box	Cream (Topical)	Cream (Topical)	0	10	50	0	0	\N	\N	\N	t	2026-04-10 02:25:51.568	2026-04-10 02:25:51.568	2f33c982-33d9-416b-bb9c-90602896da7d
\.


--
-- Data for Name: queue_numbers; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.queue_numbers (id, "queueNo", "patientId", "appointmentId", "queueDate", "estimatedTime", "actualCallTime", status, notes, "createdAt", "updatedAt", "clinicId", "departmentId", "doctorId", "registrationId") FROM stdin;
f6abe884-4959-4381-a25d-bb2cf1d4fd5e	P-004	93314f7c-0944-4aad-a530-1da5ec56e610	\N	2026-04-10 04:38:12.077	\N	\N	waiting	\N	2026-04-10 04:38:12.078	2026-04-10 04:38:12.078	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	fcdc8050-3901-44a8-af58-0b010cac2b4c	d2a72bca-530f-4ecb-bf29-3edab7843217
f116c4a8-dee0-49e2-91b5-b6116f21b5df	A-002	93314f7c-0944-4aad-a530-1da5ec56e610	\N	2026-04-10 04:46:24.875	\N	2026-04-10 05:20:27.799	completed	\N	2026-04-10 04:46:24.876	2026-04-10 05:23:03.361	2f33c982-33d9-416b-bb9c-90602896da7d	\N	07d9169d-f641-49da-a550-5da9db6949e7	e28dd919-9367-4c22-a4ef-068a2f390c4b
70c60a55-b6ea-465c-8d7f-b5fa63b65635	P-001	188ce51e-d892-4b1a-b033-ccaf04962681	\N	2026-04-10 03:26:37.02	\N	2026-04-10 05:40:58.36	ongoing	\N	2026-04-10 03:26:37.021	2026-04-10 05:41:10.677	2f33c982-33d9-416b-bb9c-90602896da7d	b3ba96be-48cf-4e72-8347-da06f6a9485c	fcdc8050-3901-44a8-af58-0b010cac2b4c	f39d3e18-a351-42cd-9a68-471a3f5c2b60
2543dcdf-4309-4e92-911c-045bc75b69c8	A-001	bfb77789-f809-4f93-9b10-91962620022f	\N	2026-04-10 03:24:43.611	\N	2026-04-10 03:43:35.233	completed	\N	2026-04-10 03:24:43.612	2026-04-10 05:42:37.023	2f33c982-33d9-416b-bb9c-90602896da7d	\N	e808b84b-3155-4d31-977b-b86048c29a75	a7c8f0fe-46ad-4a0a-a4ff-4ba17a6a6915
f7a7da84-fe04-4fa9-8454-437c9bd10a84	A-001	93314f7c-0944-4aad-a530-1da5ec56e610	\N	2026-04-09 16:09:29.206	\N	2026-04-09 16:10:38.649	completed	\N	2026-04-09 16:09:29.208	2026-04-09 16:13:05.423	2f33c982-33d9-416b-bb9c-90602896da7d	\N	fcdc8050-3901-44a8-af58-0b010cac2b4c	82918c30-1da4-4f0c-a0ba-7fe81256adb7
1215e810-d595-428d-af78-de25ba8e4ad5	P-002	26ed906e-769c-433d-a97e-af832ead32ec	\N	2026-04-10 03:45:25.131	\N	2026-04-10 05:12:59.842	completed	\N	2026-04-10 03:45:25.132	2026-04-10 05:18:51.764	2f33c982-33d9-416b-bb9c-90602896da7d	b3ba96be-48cf-4e72-8347-da06f6a9485c	07d9169d-f641-49da-a550-5da9db6949e7	cdaf9d9a-8306-4634-a497-4a4b0de1cedb
7b4a8e33-3753-4bc7-bbbb-2da589e25960	A-003	be871b17-68a4-49b4-9ac6-49eb3ee0503a	\N	2026-04-10 04:55:56.471	\N	2026-04-10 05:29:29.893	called	\N	2026-04-10 04:55:56.472	2026-04-10 05:29:29.895	2f33c982-33d9-416b-bb9c-90602896da7d	\N	07d9169d-f641-49da-a550-5da9db6949e7	01853cfe-7cd6-41a1-ab58-364963470471
984d478f-3259-4356-be28-c9d64903a83d	P-003	93314f7c-0944-4aad-a530-1da5ec56e610	\N	2026-04-10 04:37:43.065	\N	2026-04-10 05:32:12.422	called	\N	2026-04-10 04:37:43.066	2026-04-10 05:32:12.424	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	fcdc8050-3901-44a8-af58-0b010cac2b4c	437b7a29-338c-4a5e-93b0-07470f1636e7
3159132d-1c46-4018-82f4-b507e133e5a0	A-001	bfb77789-f809-4f93-9b10-91962620022f	\N	2026-04-10 05:44:01.709	\N	2026-04-10 05:45:06.57	ongoing	\N	2026-04-10 05:44:01.711	2026-04-10 05:45:15.582	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	e808b84b-3155-4d31-977b-b86048c29a75	9ba51307-dd18-4293-bf16-bf3f68f7c480
004805be-6d21-4467-9349-4cc7db5aca0f	P-005	f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	\N	2026-04-10 04:53:15.253	\N	2026-04-10 05:25:20.73	completed	\N	2026-04-10 04:53:15.255	2026-04-10 05:54:45.954	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	07d9169d-f641-49da-a550-5da9db6949e7	70448748-54e9-40b1-ba07-1120f975cc40
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.registrations (id, "patientId", "registrationNo", "registrationDate", status, "visitType", "referralDocument", "referralFrom", "createdAt", "updatedAt", "clinicId", "departmentId", "doctorId") FROM stdin;
82918c30-1da4-4f0c-a0ba-7fe81256adb7	93314f7c-0944-4aad-a530-1da5ec56e610	REG-20260408-0001	2026-04-09 16:09:29.2	completed	outpatient	\N		2026-04-09 16:09:29.201	2026-04-09 16:09:29.201	2f33c982-33d9-416b-bb9c-90602896da7d	\N	fcdc8050-3901-44a8-af58-0b010cac2b4c
a7c8f0fe-46ad-4a0a-a4ff-4ba17a6a6915	bfb77789-f809-4f93-9b10-91962620022f	REG-20260409-0001	2026-04-10 03:24:43.604	completed	outpatient	\N		2026-04-10 03:24:43.605	2026-04-10 03:24:43.605	2f33c982-33d9-416b-bb9c-90602896da7d	\N	e808b84b-3155-4d31-977b-b86048c29a75
f39d3e18-a351-42cd-9a68-471a3f5c2b60	188ce51e-d892-4b1a-b033-ccaf04962681	REG-20260409-0002	2026-04-10 03:26:37.019	completed	outpatient	\N		2026-04-10 03:26:37.02	2026-04-10 03:26:37.02	2f33c982-33d9-416b-bb9c-90602896da7d	b3ba96be-48cf-4e72-8347-da06f6a9485c	fcdc8050-3901-44a8-af58-0b010cac2b4c
cdaf9d9a-8306-4634-a497-4a4b0de1cedb	26ed906e-769c-433d-a97e-af832ead32ec	REG-20260409-0003	2026-04-10 03:45:25.128	completed	outpatient	\N		2026-04-10 03:45:25.129	2026-04-10 03:45:25.129	2f33c982-33d9-416b-bb9c-90602896da7d	b3ba96be-48cf-4e72-8347-da06f6a9485c	07d9169d-f641-49da-a550-5da9db6949e7
437b7a29-338c-4a5e-93b0-07470f1636e7	93314f7c-0944-4aad-a530-1da5ec56e610	REG-20260409-0004	2026-04-10 04:37:43.062	completed	outpatient	\N		2026-04-10 04:37:43.063	2026-04-10 04:37:43.063	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	fcdc8050-3901-44a8-af58-0b010cac2b4c
d2a72bca-530f-4ecb-bf29-3edab7843217	93314f7c-0944-4aad-a530-1da5ec56e610	REG-20260409-0005	2026-04-10 04:38:12.075	completed	outpatient	\N		2026-04-10 04:38:12.077	2026-04-10 04:38:12.077	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	fcdc8050-3901-44a8-af58-0b010cac2b4c
e28dd919-9367-4c22-a4ef-068a2f390c4b	93314f7c-0944-4aad-a530-1da5ec56e610	REG-20260409-0006	2026-04-10 04:46:24.871	completed	outpatient	\N		2026-04-10 04:46:24.873	2026-04-10 04:46:24.873	2f33c982-33d9-416b-bb9c-90602896da7d	\N	07d9169d-f641-49da-a550-5da9db6949e7
70448748-54e9-40b1-ba07-1120f975cc40	f912bc4a-6eb9-430f-afe3-9a3c3f0b76d5	REG-20260409-0007	2026-04-10 04:53:15.25	completed	outpatient	\N		2026-04-10 04:53:15.252	2026-04-10 04:53:15.252	2f33c982-33d9-416b-bb9c-90602896da7d	dd976d6c-e623-4376-99cc-baba9e75cf61	07d9169d-f641-49da-a550-5da9db6949e7
01853cfe-7cd6-41a1-ab58-364963470471	be871b17-68a4-49b4-9ac6-49eb3ee0503a	REG-20260409-0008	2026-04-10 04:55:56.468	completed	outpatient	\N		2026-04-10 04:55:56.469	2026-04-10 04:55:56.469	2f33c982-33d9-416b-bb9c-90602896da7d	\N	07d9169d-f641-49da-a550-5da9db6949e7
9ba51307-dd18-4293-bf16-bf3f68f7c480	bfb77789-f809-4f93-9b10-91962620022f	REG-20260409-0001	2026-04-10 05:44:01.704	completed	outpatient	\N		2026-04-10 05:44:01.706	2026-04-10 05:44:01.706	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N	e808b84b-3155-4d31-977b-b86048c29a75
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.service_categories (id, "categoryName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
cat-001	Konsultasi	Layanan konsultasi dengan dokter umum, spesialis, dan subspesialis	t	2026-04-09 14:18:17.846	2026-04-09 14:18:17.846
cat-002	Tindakan Medis	Tindakan medis minor, major, dan prosedur bedah kecil	t	2026-04-09 14:18:17.85	2026-04-09 14:18:17.85
cat-003	Pemeriksaan Laboratorium	Tes darah, urine, feses, hormon, dan penanda penyakit	t	2026-04-09 14:18:17.851	2026-04-09 14:18:17.851
cat-004	Radiologi & Imaging	USG, X-Ray, CT Scan, MRI, Mammografi, dan fluoroskopi	t	2026-04-09 14:18:17.852	2026-04-09 14:18:17.852
cat-005	Terapi & Rehabilitasi	Fisioterapi, okupasi terapi, terapi wicara, dan akupunktur	t	2026-04-09 14:18:17.853	2026-04-09 14:18:17.853
cat-006	Paket Kesehatan & Vaksinasi	Paket medical check up, imunisasi dewasa, anak, dan lansia	t	2026-04-09 14:18:17.855	2026-04-09 14:18:17.855
cat-007	Tindakan Gigi	Scaling, tambal, cabut, veneer, kawat gigi, implan, pemutihan gigi	t	2026-04-09 14:18:17.856	2026-04-09 14:18:17.856
cat-008	Perawatan Estetika Medis	Botox, filler, laser, chemical peeling, microneedling, PRP	t	2026-04-09 14:18:17.857	2026-04-09 14:18:17.857
cat-009	Gawat Darurat & Ambulans	Layanan IGD 24 jam, ambulans, dan pertolongan pertama	t	2026-04-09 14:18:17.858	2026-04-09 14:18:17.858
cat-010	Home Care & Telemedisin	Layanan kunjungan dokter ke rumah, konsultasi online	t	2026-04-09 14:18:17.859	2026-04-09 14:18:17.859
cat-011	Psikologi & Kejiwaan	Konseling psikologi, psikotes, psikiater, terapi perilaku	t	2026-04-09 14:18:17.861	2026-04-09 14:18:17.861
cat-012	Gizi & Dietetik	Konsultasi gizi, diet khusus, body composition analysis	t	2026-04-09 14:18:17.862	2026-04-09 14:18:17.862
cat-013	Optometri & Optik	Pemeriksaan mata, kacamata, lensa kontak, terapi mata malas	t	2026-04-09 14:18:17.863	2026-04-09 14:18:17.863
cat-014	Audiology & THT	Pemeriksaan pendengaran, tinnitus terapi, fitting alat bantu dengar	t	2026-04-09 14:18:17.864	2026-04-09 14:18:17.864
cat-015	Program Promotif & Preventif	Edukasi kesehatan, screening penyakit, program deteksi dini	t	2026-04-09 14:18:17.865	2026-04-09 14:18:17.865
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.services (id, "serviceCode", "serviceName", description, category, unit, price, "isActive", "createdAt", "updatedAt", "clinicId", "categoryId") FROM stdin;
svc-001	KONS-001	Konsultasi Dokter Umum	Konsultasi dengan dokter umum, termasuk resep dan rujukan	\N	session	150000	t	2026-04-09 14:18:17.866	2026-04-09 14:18:17.866	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-002	KONS-002	Konsultasi Dokter Spesialis Jantung	Konsultasi dengan Spesialis Jantung (Sp.JP)	\N	session	350000	t	2026-04-09 14:18:17.871	2026-04-09 14:18:17.871	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-003	KONS-003	Konsultasi Dokter Spesialis Anak	Konsultasi tumbuh kembang, imunisasi, dan nutrisi anak	\N	session	250000	t	2026-04-09 14:18:17.873	2026-04-09 14:18:17.873	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-004	KONS-004	Konsultasi Dokter Spesialis Kandungan	Konsultasi kehamilan, kesehatan reproduksi wanita	\N	session	300000	t	2026-04-09 14:18:17.874	2026-04-09 14:18:17.874	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-005	KONS-005	Konsultasi Dokter Spesialis Saraf	Konsultasi sakit kepala, stroke, gangguan saraf	\N	session	350000	t	2026-04-09 14:18:17.876	2026-04-09 14:18:17.876	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-006	KONS-006	Konsultasi Dokter Spesialis Bedah	Konsultasi pra/pasca operasi, tumor, hernia	\N	session	400000	t	2026-04-09 14:18:17.877	2026-04-09 14:18:17.877	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-001
svc-007	TINDAK-001	Jahit Luka (Minor)	Penjahitan luka tanpa komplikasi, termasuk anestesi lokal	\N	item	500000	t	2026-04-09 14:18:17.879	2026-04-09 14:18:17.879	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-008	TINDAK-002	Pemasangan Infus	Pemasangan IV line untuk rehidrasi, obat	\N	item	150000	t	2026-04-09 14:18:17.88	2026-04-09 14:18:17.88	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-009	TINDAK-003	Injeksi & Suntik Obat	Suntikan IM/IV/SC termasuk obat (non spesial)	\N	item	75000	t	2026-04-09 14:18:17.881	2026-04-09 14:18:17.881	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-010	TINDAK-004	Perawatan Luka Bakar Ringan	Perawatan luka bakar derajat 1-2 (<10%)	\N	session	350000	t	2026-04-09 14:18:17.882	2026-04-09 14:18:17.882	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-011	TINDAK-005	Pemasangan Kateter Urin	Pemasangan folley catheter	\N	item	200000	t	2026-04-09 14:18:17.883	2026-04-09 14:18:17.883	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-012	TINDAK-006	Insisi & Drainase Abses	Membuka dan mengeluarkan nanah pada abses kecil	\N	item	750000	t	2026-04-09 14:18:17.884	2026-04-09 14:18:17.884	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-002
svc-013	LAB-001	Hematologi Lengkap	Pemeriksaan HB, leukosit, trombosit, hematokrit	\N	item	120000	t	2026-04-09 14:18:17.885	2026-04-09 14:18:17.885	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-014	LAB-002	Gula Darah Puasa & 2 Jam PP	Tes toleransi gula darah (screening DM)	\N	item	85000	t	2026-04-09 14:18:17.887	2026-04-09 14:18:17.887	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-015	LAB-003	Profil Lipid Lengkap	Pemeriksaan kolesterol total, HDL, LDL, TG	\N	item	140000	t	2026-04-09 14:18:17.888	2026-04-09 14:18:17.888	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-016	LAB-004	Fungsi Hati (SGOT/SGPT/Gamma GT)	Pemeriksaan enzim hati	\N	item	110000	t	2026-04-09 14:18:17.889	2026-04-09 14:18:17.889	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-017	LAB-005	Fungsi Ginjal (Ureum & Kreatinin)	Pemeriksaan kadar ureum dan kreatinin	\N	item	90000	t	2026-04-09 14:18:17.89	2026-04-09 14:18:17.89	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-018	LAB-006	Urinalisa Lengkap	Pemeriksaan fisik, kimia, mikroskopis urine	\N	item	70000	t	2026-04-09 14:18:17.891	2026-04-09 14:18:17.891	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-019	LAB-007	Hormon Tiroid (TSH/fT4)	Pemeriksaan fungsi tiroid	\N	item	180000	t	2026-04-09 14:18:17.892	2026-04-09 14:18:17.892	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-020	LAB-008	Marka Jantung (Troponin/CKMB)	Pemeriksaan untuk diagnosis infark miokard	\N	item	220000	t	2026-04-09 14:18:17.893	2026-04-09 14:18:17.893	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-003
svc-021	RAD-001	USG Abdomen	Pemeriksaan organ hati, empedu, pankreas, ginjal	\N	item	350000	t	2026-04-09 14:18:17.895	2026-04-09 14:18:17.895	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-022	RAD-002	USG Payudara + Doppler	Pemeriksaan payudara untuk massa/tumor	\N	item	400000	t	2026-04-09 14:18:17.896	2026-04-09 14:18:17.896	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-023	RAD-003	Foto Thorax (X-Ray Dada)	Pemeriksaan paru, jantung, tulang iga	\N	item	200000	t	2026-04-09 14:18:17.897	2026-04-09 14:18:17.897	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-024	RAD-004	Foto Polos Tulang (1 regio)	X-Ray ekstremitas atau tulang belakang	\N	item	180000	t	2026-04-09 14:18:17.898	2026-04-09 14:18:17.898	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-025	RAD-005	CT Scan Kepala (Non Kontras)	Pencitraan otak (stroke/trauma)	\N	item	1200000	t	2026-04-09 14:18:17.899	2026-04-09 14:18:17.899	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-026	RAD-006	CT Scan Abdomen (Dengan Kontras)	Pencitraan detail organ perut dengan kontras	\N	item	1800000	t	2026-04-09 14:18:17.9	2026-04-09 14:18:17.9	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-027	RAD-007	MRI Lumbosakral	Pencitraan tulang belakang (HNP)	\N	item	2500000	t	2026-04-09 14:18:17.901	2026-04-09 14:18:17.901	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-028	RAD-008	Mammografi Digital	Screening kanker payudara	\N	item	500000	t	2026-04-09 14:18:17.902	2026-04-09 14:18:17.902	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-004
svc-029	TERAPI-001	Fisioterapi (1 Sesi)	Latihan, TENS/IFT, manual therapy	\N	session	200000	t	2026-04-09 14:18:17.903	2026-04-09 14:18:17.903	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-005
svc-030	TERAPI-002	Pijat Medis (Sport/Neuromuscular)	Terapi cedera olahraga, nyeri otot	\N	session	250000	t	2026-04-09 14:18:17.904	2026-04-09 14:18:17.904	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-005
svc-031	TERAPI-003	Akupunktur Medis (1 Sesi)	Terapi jarum nyeri kronis, migrain	\N	session	300000	t	2026-04-09 14:18:17.905	2026-04-09 14:18:17.905	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-005
svc-032	TERAPI-004	Okupasi Terapi Anak	Terapi keterlambatan perkembangan/autisme	\N	session	350000	t	2026-04-09 14:18:17.906	2026-04-09 14:18:17.906	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-005
svc-033	TERAPI-005	Terapi Wicara	Terapi gangguan bicara/artikulasi	\N	session	300000	t	2026-04-09 14:18:17.908	2026-04-09 14:18:17.908	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-005
svc-034	PAKET-001	Medical Check Up Basic	Hematolgi, Gula darah, Kolesterol, Urinalisa	\N	package	350000	t	2026-04-09 14:18:17.909	2026-04-09 14:18:17.909	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-035	PAKET-002	Medical Check Up Eksekutif	EKG, USG, Lab lengkap, Dokter	\N	package	1200000	t	2026-04-09 14:18:17.911	2026-04-09 14:18:17.911	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-036	PAKET-003	Medical Check Up Karyawan	Paket standar screening karyawan	\N	package	450000	t	2026-04-09 14:18:17.912	2026-04-09 14:18:17.912	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-037	PAKET-004	Paket Prolanis (Hipertensi + Diabetes)	Monitoring rutin pasien prolanis	\N	package	250000	t	2026-04-09 14:18:17.913	2026-04-09 14:18:17.913	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-038	PAKET-005	Vaksin COVID-19 (Booster Pfizer)	Vaksinasi booster dosis ke-2	\N	item	250000	t	2026-04-09 14:18:17.914	2026-04-09 14:18:17.914	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-039	PAKET-006	Vaksin Influenza (Flu)	Vaksin flu tahunan dewasa/anak	\N	item	180000	t	2026-04-09 14:18:17.915	2026-04-09 14:18:17.915	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-040	PAKET-007	Vaksin Hepatitis B (Dosis 1-3)	Vaksinasi hepatitis B dewasa	\N	item	220000	t	2026-04-09 14:18:17.916	2026-04-09 14:18:17.916	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-041	PAKET-008	Vaksin HPV (Gardasil 9)	Vaksin pencegahan kanker serviks	\N	item	850000	t	2026-04-09 14:18:17.918	2026-04-09 14:18:17.918	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-006
svc-042	GIGI-001	Scaling & Poles Gigi	Pembersihan karang gigi ultrasonik	\N	session	300000	t	2026-04-09 14:18:17.919	2026-04-09 14:18:17.919	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-043	GIGI-002	Tambal Gigi (Resin Komposit)	Penambalan gigi warna gigi	\N	item	350000	t	2026-04-09 14:18:17.92	2026-04-09 14:18:17.92	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-044	GIGI-003	Cabut Gigi (Permanen Non Bedah)	Pencabutan gigi dengan anestesi lokal	\N	item	250000	t	2026-04-09 14:18:17.921	2026-04-09 14:18:17.921	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-045	GIGI-004	Veneer Gigi (Resin/1 gigi)	Pemasangan veneer resin	\N	item	750000	t	2026-04-09 14:18:17.922	2026-04-09 14:18:17.922	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-046	GIGI-005	Bleaching / Pemutihan Gigi	Pemutihan gigi LED (in-office)	\N	session	1500000	t	2026-04-09 14:18:17.923	2026-04-09 14:18:17.923	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-047	GIGI-006	Pemasangan Behel / Ortodonti	Pemasangan kawat gigi metal	\N	package	5000000	t	2026-04-09 14:18:17.925	2026-04-09 14:18:17.925	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-007
svc-048	ESTETIK-001	Injeksi Botox (1 area)	Pengurangan kerutan wajah	\N	session	2500000	t	2026-04-09 14:18:17.926	2026-04-09 14:18:17.926	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-008
svc-049	ESTETIK-002	Filler Asam Hyaluronat (1 cc)	Pengisi area wajah/pipi/bibir	\N	session	3500000	t	2026-04-09 14:18:17.927	2026-04-09 14:18:17.927	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-008
svc-050	ESTETIK-003	Chemical Peeling (Medium)	Pengangkatan sel kulit mati	\N	session	850000	t	2026-04-09 14:18:17.928	2026-04-09 14:18:17.928	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-008
svc-051	ESTETIK-004	Laser CO2 Fraksional	Resurfacing laser bekas jerawat	\N	session	3000000	t	2026-04-09 14:18:17.929	2026-04-09 14:18:17.929	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-008
svc-052	ESTETIK-005	Microneedling + PRP	Microneedling dengan PRP	\N	session	2800000	t	2026-04-09 14:18:17.93	2026-04-09 14:18:17.93	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-008
svc-053	IGD-001	Pelayanan Gawat Darurat (IGD)	Pelayanan 24 jam kasus emergensi	\N	session	300000	t	2026-04-09 14:18:17.931	2026-04-09 14:18:17.931	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-009
svc-054	IGD-002	Panggilan Ambulans (Dalam Kota)	Ambulans paramedis, radius 10 km	\N	item	500000	t	2026-04-09 14:18:17.932	2026-04-09 14:18:17.932	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-009
svc-055	HOMECARE-001	Kunjungan Dokter ke Rumah	Kunjungan dokter umum ke rumah (dalam kota)	\N	session	350000	t	2026-04-09 14:18:17.933	2026-04-09 14:18:17.933	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-010
svc-056	HOMECARE-002	Konsultasi Online (Telemedisin)	Konsultasi via chat/video dokter umum	\N	session	75000	t	2026-04-09 14:18:17.934	2026-04-09 14:18:17.934	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-010
svc-057	PSIKIATRI-001	Konsultasi Psikologi	Sesi konseling (60 menit)	\N	session	300000	t	2026-04-09 14:18:17.936	2026-04-09 14:18:17.936	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-011
svc-058	PSIKIATRI-002	Konsultasi Psikiater	Konsultasi manajemen obat jiwa	\N	session	400000	t	2026-04-09 14:18:17.937	2026-04-09 14:18:17.937	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-011
svc-059	GIZI-001	Konsultasi Gizi Klinis	Konsultasi diet khusus (diabetes/jantung)	\N	session	200000	t	2026-04-09 14:18:17.939	2026-04-09 14:18:17.939	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-012
svc-060	GIZI-002	Body Composition Analysis (BIA)	Analisis komposisi tubuh	\N	item	125000	t	2026-04-09 14:18:17.941	2026-04-09 14:18:17.941	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-012
svc-061	MATA-001	Pemeriksaan Mata Lengkap	Tajam penglihatan, refraksi	\N	session	150000	t	2026-04-09 14:18:17.942	2026-04-09 14:18:17.942	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-013
svc-062	THT-001	Pemeriksaan THT + Audiometri	Pemeriksaan THT + tes pendengaran	\N	session	250000	t	2026-04-09 14:18:17.943	2026-04-09 14:18:17.943	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-014
svc-063	PREVENTIF-001	Screening Diabetes Gratis	Pemeriksaan GDS + edukasi (event)	\N	item	0	t	2026-04-09 14:18:17.944	2026-04-09 14:18:17.944	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-015
svc-064	PREVENTIF-002	Edukasi Kesehatan Jantung	Sesi edukasi pencegahan jantung	\N	session	100000	t	2026-04-09 14:18:17.945	2026-04-09 14:18:17.945	cdf427a7-bf4d-478e-97e7-7f24c214f584	cat-015
3a8fcd27-6ac7-4eff-afa2-2780a2e7dfd7	REG-001	Biaya Pendaftaran	\N	\N	\N	50000	t	2026-04-09 14:52:56.952	2026-04-09 14:52:56.952	2f33c982-33d9-416b-bb9c-90602896da7d	\N
b9ef4fbc-ac70-4006-80c3-017a2f4d8f3c	REG-K001	Biaya Pendaftaran	\N	Administrasi	\N	50000	t	2026-04-10 05:44:01.717	2026-04-10 05:44:01.717	cdf427a7-bf4d-478e-97e7-7f24c214f584	\N
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.site_settings (id, key, value, description, "updatedAt", "clinicId") FROM stdin;
\.


--
-- Data for Name: user_clinics; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.user_clinics (id, "userId", "clinicId", "createdAt") FROM stdin;
ee1d7ece-c17d-422c-88c0-060001f86ef1	aa0863a6-de9a-4773-9921-846d77655666	2f33c982-33d9-416b-bb9c-90602896da7d	2026-04-09 11:14:48.417
3797d362-f6d5-4100-a1b4-06e16103373a	4e78ad24-f027-42e7-9d5f-0c460bc2af8f	cdf427a7-bf4d-478e-97e7-7f24c214f584	2026-04-09 11:14:54.903
e6955bfe-f10a-484a-bd35-9932e08882c5	4e78ad24-f027-42e7-9d5f-0c460bc2af8f	2f33c982-33d9-416b-bb9c-90602896da7d	2026-04-09 11:14:54.903
aa83d250-2751-4e24-9a0a-737487e2cc43	13068bfa-d81b-41ed-8ad8-d46779f74c44	2f33c982-33d9-416b-bb9c-90602896da7d	2026-04-09 11:15:21.505
1eb27b80-d16c-4ec7-b8bb-b2fd40ee7847	dcfbd485-4364-4c37-9333-b95c742da50c	cdf427a7-bf4d-478e-97e7-7f24c214f584	2026-04-09 11:25:45.682
8a97cc7f-7dd4-4104-bf24-ab4d96585151	dcfbd485-4364-4c37-9333-b95c742da50c	2f33c982-33d9-416b-bb9c-90602896da7d	2026-04-09 11:25:45.682
6fd028ee-83bb-4595-9967-c9239d186038	bdd81275-c217-4694-ba39-36153748027f	cdf427a7-bf4d-478e-97e7-7f24c214f584	2026-04-09 12:41:11.402
12059a96-e72d-4def-ad09-a2730185f18c	3a347d5d-7507-41d8-9875-2f86192f2026	cdf427a7-bf4d-478e-97e7-7f24c214f584	2026-04-10 05:53:08.582
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.users (id, email, username, password, name, phone, "isActive", "lastLogin", "createdAt", "updatedAt", role, image) FROM stdin;
aa0863a6-de9a-4773-9921-846d77655666	rohani@clinic.com	rohani	$2b$10$3hIW3D0R5Cn9xKkQBFJx3.yJAjhPSYqQ9uxa7diceN.ispfF9fwu6	Rohani	081286341759	t	2026-04-10 04:27:56.266	2026-04-09 11:14:40.936	2026-04-10 04:27:56.267	DOCTOR	\N
13068bfa-d81b-41ed-8ad8-d46779f74c44	admin_bekasi@clinic.com	Admin Bekasi 	$2b$10$l4tE7MrGGd68B4ZDXcucfe4S0EwlIJbDpLeXs0/Z59FsAwL0NI7DG	Admin Bekasi 		t	2026-04-10 05:26:16.719	2026-04-09 11:07:48.832	2026-04-10 05:26:16.72	ADMIN	\N
4e78ad24-f027-42e7-9d5f-0c460bc2af8f	herman@clinic.com	herman	$2b$10$/0k43DNDrnGtUuX7Uxdx1.uWO1e/45N2HjJqrB8UVmINVsHPez6L.	Herman		t	2026-04-10 05:28:09.542	2026-04-09 11:14:15.08	2026-04-10 05:28:09.544	DOCTOR	\N
bdd81275-c217-4694-ba39-36153748027f	dr.fauzi@clinic.com	drfauzi	$2b$10$WysTv2bk6j5j5qY2wKNcQ.j9La9/u9j3RPGDGmnaLevzhPatquHPC	dr. Ahmad Fauzi		t	2026-04-10 05:42:21.689	2026-04-09 10:52:53.734	2026-04-10 05:42:21.69	DOCTOR	\N
3a347d5d-7507-41d8-9875-2f86192f2026	admin_pusat@clinic.com	admin_pusat	$2b$10$PHK6jbVP7Ad7J/vQ3oXuquFsY/RV5Agl5D2SylLs9NtrPu92Yvv8C	Administrator_Pusat		t	2026-04-10 05:52:44.74	2026-04-09 10:52:53.675	2026-04-10 05:53:08.582	ADMIN	\N
dcfbd485-4364-4c37-9333-b95c742da50c	superadmin@clinic.com	superadmin	$2b$10$IrmQzCQi9Hl0erY4X0q5K.4yr8H.x6wb3U7ngeiWmHBq0V8qkYIV.	Super Administrator		t	2026-04-10 05:59:13.443	2026-04-09 10:52:53.615	2026-04-10 05:59:13.445	SUPER_ADMIN	\N
\.


--
-- Data for Name: vital_signs; Type: TABLE DATA; Schema: public; Owner: clinic
--

COPY public.vital_signs (id, "medicalRecordId", temperature, "bloodPressure", "heartRate", "respiratoryRate", weight, height, "bloodOxygen", notes, "recordedAt") FROM stdin;
df05edc0-da81-4db9-9239-e53b6379dbf0	5a8e250a-87b4-4cad-99b8-ffc4ed5e908f	38	120/90	\N	\N	70	168	\N		2026-04-09 16:10:20.422
9d0f0e29-e094-49d6-ba09-8f0f822b7195	aa6ded5f-3e0e-4b40-adf3-229fe4594087	37	120/90	110	\N	66	163	\N	Membawa Obat dari Apotik 	2026-04-10 03:34:53.101
36ef2932-590f-4f75-ba25-7e740c182323	0ded2dc4-caec-49dc-b5ce-b4170152be44	33	120/80	110	\N	65	165	\N		2026-04-10 04:34:39.613
62725205-2c9d-467f-beb0-f117918a4501	be0b0d89-8641-4d2e-b6ab-fa39ac16d503	37	120/80	\N	\N	45	159	\N		2026-04-10 04:57:49.774
68df47b8-8aaf-491b-a742-ed8477c36799	0fd2a68c-38db-4b78-8fdf-f206b22e7485	39	120/90	\N	\N	68	159	\N		2026-04-10 05:03:09.359
022fc8c1-f1a7-4556-a449-bff55ffbbea1	c4290efc-555a-459b-a2c8-766d8c454fb2	33	120/80	\N	\N	75	167	\N	Sudah 5 Hari belum berkurang 	2026-04-10 05:29:22.465
0a56fc1e-85f9-4c13-9650-8cb30f0ba2f7	44af6daa-ec5b-494b-93b9-43a92d6696ef	33	120/70	\N	\N	55	160	\N		2026-04-10 05:31:59.146
a47fbaed-872d-4324-87c1-a2c2c32ae2c2	9b5da1bc-3f3d-43f9-9d96-943929dfd4ec	33	120/80	\N	\N	77	170	\N		2026-04-10 05:44:43.289
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: appointment_services appointment_services_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: financial_reports financial_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT financial_reports_pkey PRIMARY KEY (id);


--
-- Name: inventory_adjustments inventory_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT inventory_adjustments_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: medical_record_services medical_record_services_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_record_services
    ADD CONSTRAINT medical_record_services_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_masters product_masters_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.product_masters
    ADD CONSTRAINT product_masters_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: queue_numbers queue_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.queue_numbers
    ADD CONSTRAINT queue_numbers_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: user_clinics user_clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.user_clinics
    ADD CONSTRAINT user_clinics_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vital_signs vital_signs_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.vital_signs
    ADD CONSTRAINT vital_signs_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "activity_logs_createdAt_idx" ON public.activity_logs USING btree ("createdAt");


--
-- Name: activity_logs_userId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "activity_logs_userId_idx" ON public.activity_logs USING btree ("userId");


--
-- Name: appointment_services_appointmentId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "appointment_services_appointmentId_idx" ON public.appointment_services USING btree ("appointmentId");


--
-- Name: appointments_appointmentDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "appointments_appointmentDate_idx" ON public.appointments USING btree ("appointmentDate");


--
-- Name: appointments_appointmentNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "appointments_appointmentNo_key" ON public.appointments USING btree ("appointmentNo");


--
-- Name: appointments_doctorId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "appointments_doctorId_idx" ON public.appointments USING btree ("doctorId");


--
-- Name: appointments_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "appointments_patientId_idx" ON public.appointments USING btree ("patientId");


--
-- Name: appointments_status_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX appointments_status_idx ON public.appointments USING btree (status);


--
-- Name: assets_assetCode_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "assets_assetCode_idx" ON public.assets USING btree ("assetCode");


--
-- Name: assets_assetCode_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "assets_assetCode_key" ON public.assets USING btree ("assetCode");


--
-- Name: assets_category_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX assets_category_idx ON public.assets USING btree (category);


--
-- Name: assets_masterProductId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "assets_masterProductId_idx" ON public.assets USING btree ("masterProductId");


--
-- Name: assets_status_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX assets_status_idx ON public.assets USING btree (status);


--
-- Name: clinics_code_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX clinics_code_key ON public.clinics USING btree (code);


--
-- Name: departments_parentId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "departments_parentId_idx" ON public.departments USING btree ("parentId");


--
-- Name: doctor_schedules_clinicId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "doctor_schedules_clinicId_idx" ON public.doctor_schedules USING btree ("clinicId");


--
-- Name: doctor_schedules_doctorId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "doctor_schedules_doctorId_idx" ON public.doctor_schedules USING btree ("doctorId");


--
-- Name: doctors_departmentId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "doctors_departmentId_idx" ON public.doctors USING btree ("departmentId");


--
-- Name: doctors_email_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX doctors_email_key ON public.doctors USING btree (email);


--
-- Name: doctors_licenseNumber_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON public.doctors USING btree ("licenseNumber");


--
-- Name: doctors_specialization_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX doctors_specialization_idx ON public.doctors USING btree (specialization);


--
-- Name: doctors_userId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "doctors_userId_key" ON public.doctors USING btree ("userId");


--
-- Name: expense_categories_categoryName_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "expense_categories_categoryName_key" ON public.expense_categories USING btree ("categoryName");


--
-- Name: expenses_categoryId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "expenses_categoryId_idx" ON public.expenses USING btree ("categoryId");


--
-- Name: expenses_expenseDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "expenses_expenseDate_idx" ON public.expenses USING btree ("expenseDate");


--
-- Name: expenses_expenseNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "expenses_expenseNo_key" ON public.expenses USING btree ("expenseNo");


--
-- Name: financial_reports_reportDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "financial_reports_reportDate_idx" ON public.financial_reports USING btree ("reportDate");


--
-- Name: inventory_adjustments_inventoryId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "inventory_adjustments_inventoryId_idx" ON public.inventory_adjustments USING btree ("inventoryId");


--
-- Name: inventory_category_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX inventory_category_idx ON public.inventory USING btree (category);


--
-- Name: inventory_itemCode_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "inventory_itemCode_idx" ON public.inventory USING btree ("itemCode");


--
-- Name: inventory_itemCode_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "inventory_itemCode_key" ON public.inventory USING btree ("itemCode");


--
-- Name: inventory_transactions_inventoryId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "inventory_transactions_inventoryId_idx" ON public.inventory_transactions USING btree ("inventoryId");


--
-- Name: inventory_transactions_transactionType_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "inventory_transactions_transactionType_idx" ON public.inventory_transactions USING btree ("transactionType");


--
-- Name: invoice_items_invoiceId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "invoice_items_invoiceId_idx" ON public.invoice_items USING btree ("invoiceId");


--
-- Name: invoices_invoiceDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "invoices_invoiceDate_idx" ON public.invoices USING btree ("invoiceDate");


--
-- Name: invoices_invoiceNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON public.invoices USING btree ("invoiceNo");


--
-- Name: invoices_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "invoices_patientId_idx" ON public.invoices USING btree ("patientId");


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: medical_record_services_medicalRecordId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "medical_record_services_medicalRecordId_idx" ON public.medical_record_services USING btree ("medicalRecordId");


--
-- Name: medical_records_doctorId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "medical_records_doctorId_idx" ON public.medical_records USING btree ("doctorId");


--
-- Name: medical_records_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "medical_records_patientId_idx" ON public.medical_records USING btree ("patientId");


--
-- Name: medical_records_recordNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "medical_records_recordNo_key" ON public.medical_records USING btree ("recordNo");


--
-- Name: medical_records_registrationId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "medical_records_registrationId_key" ON public.medical_records USING btree ("registrationId");


--
-- Name: medicines_clinicId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "medicines_clinicId_idx" ON public.medicines USING btree ("clinicId");


--
-- Name: medicines_medicineName_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "medicines_medicineName_idx" ON public.medicines USING btree ("medicineName");


--
-- Name: patients_medicalRecordNo_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "patients_medicalRecordNo_idx" ON public.patients USING btree ("medicalRecordNo");


--
-- Name: patients_medicalRecordNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "patients_medicalRecordNo_key" ON public.patients USING btree ("medicalRecordNo");


--
-- Name: patients_phone_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX patients_phone_idx ON public.patients USING btree (phone);


--
-- Name: payments_invoiceId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "payments_invoiceId_idx" ON public.payments USING btree ("invoiceId");


--
-- Name: payments_paymentDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "payments_paymentDate_idx" ON public.payments USING btree ("paymentDate");


--
-- Name: payments_paymentNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "payments_paymentNo_key" ON public.payments USING btree ("paymentNo");


--
-- Name: prescription_items_prescriptionId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "prescription_items_prescriptionId_idx" ON public.prescription_items USING btree ("prescriptionId");


--
-- Name: prescriptions_doctorId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "prescriptions_doctorId_idx" ON public.prescriptions USING btree ("doctorId");


--
-- Name: prescriptions_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "prescriptions_patientId_idx" ON public.prescriptions USING btree ("patientId");


--
-- Name: prescriptions_prescriptionNo_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "prescriptions_prescriptionNo_key" ON public.prescriptions USING btree ("prescriptionNo");


--
-- Name: product_categories_categoryName_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "product_categories_categoryName_key" ON public.product_categories USING btree ("categoryName");


--
-- Name: product_masters_categoryId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "product_masters_categoryId_idx" ON public.product_masters USING btree ("categoryId");


--
-- Name: product_masters_masterCode_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "product_masters_masterCode_idx" ON public.product_masters USING btree ("masterCode");


--
-- Name: product_masters_masterCode_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "product_masters_masterCode_key" ON public.product_masters USING btree ("masterCode");


--
-- Name: product_masters_medicineId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "product_masters_medicineId_key" ON public.product_masters USING btree ("medicineId");


--
-- Name: products_masterProductId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "products_masterProductId_idx" ON public.products USING btree ("masterProductId");


--
-- Name: products_productCode_clinicId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "products_productCode_clinicId_key" ON public.products USING btree ("productCode", "clinicId");


--
-- Name: products_productCode_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "products_productCode_idx" ON public.products USING btree ("productCode");


--
-- Name: products_sku_clinicId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "products_sku_clinicId_key" ON public.products USING btree (sku, "clinicId");


--
-- Name: products_sku_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX products_sku_idx ON public.products USING btree (sku);


--
-- Name: queue_numbers_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "queue_numbers_patientId_idx" ON public.queue_numbers USING btree ("patientId");


--
-- Name: queue_numbers_queueDate_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "queue_numbers_queueDate_idx" ON public.queue_numbers USING btree ("queueDate");


--
-- Name: queue_numbers_queueNo_clinicId_queueDate_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "queue_numbers_queueNo_clinicId_queueDate_key" ON public.queue_numbers USING btree ("queueNo", "clinicId", "queueDate");


--
-- Name: queue_numbers_status_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX queue_numbers_status_idx ON public.queue_numbers USING btree (status);


--
-- Name: registrations_clinicId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "registrations_clinicId_idx" ON public.registrations USING btree ("clinicId");


--
-- Name: registrations_patientId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "registrations_patientId_idx" ON public.registrations USING btree ("patientId");


--
-- Name: registrations_registrationNo_clinicId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "registrations_registrationNo_clinicId_key" ON public.registrations USING btree ("registrationNo", "clinicId");


--
-- Name: service_categories_categoryName_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "service_categories_categoryName_key" ON public.service_categories USING btree ("categoryName");


--
-- Name: services_categoryId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "services_categoryId_idx" ON public.services USING btree ("categoryId");


--
-- Name: services_serviceCode_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "services_serviceCode_idx" ON public.services USING btree ("serviceCode");


--
-- Name: services_serviceCode_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "services_serviceCode_key" ON public.services USING btree ("serviceCode");


--
-- Name: site_settings_key_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX site_settings_key_key ON public.site_settings USING btree (key);


--
-- Name: user_clinics_userId_clinicId_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX "user_clinics_userId_clinicId_key" ON public.user_clinics USING btree ("userId", "clinicId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: clinic
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: vital_signs_medicalRecordId_idx; Type: INDEX; Schema: public; Owner: clinic
--

CREATE INDEX "vital_signs_medicalRecordId_idx" ON public.vital_signs USING btree ("medicalRecordId");


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT "appointment_services_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT "appointment_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assets assets_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_masterProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_masterProductId_fkey" FOREIGN KEY ("masterProductId") REFERENCES public.product_masters(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctor_schedules doctor_schedules_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT "doctor_schedules_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctor_schedules doctor_schedules_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT "doctor_schedules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doctors doctors_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT "doctors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctors doctors_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expenses expenses_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.expense_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: financial_reports financial_reports_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT "financial_reports_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_adjustments inventory_adjustments_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT "inventory_adjustments_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory inventory_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory inventory_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_transactions inventory_transactions_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "inventory_transactions_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "invoice_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medical_record_services medical_record_services_medicalRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_record_services
    ADD CONSTRAINT "medical_record_services_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES public.medical_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medical_record_services medical_record_services_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_record_services
    ADD CONSTRAINT "medical_record_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT "medical_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medical_records medical_records_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT "medical_records_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medical_records medical_records_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT "medical_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medical_records medical_records_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT "medical_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medical_records medical_records_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT "medical_records_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescription_items prescription_items_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescription_items prescription_items_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public.prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_medicalRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES public.medical_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_masters product_masters_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.product_masters
    ADD CONSTRAINT "product_masters_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_masters product_masters_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.product_masters
    ADD CONSTRAINT "product_masters_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_masterProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_masterProductId_fkey" FOREIGN KEY ("masterProductId") REFERENCES public.product_masters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: queue_numbers queue_numbers_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.queue_numbers
    ADD CONSTRAINT "queue_numbers_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: queue_numbers queue_numbers_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.queue_numbers
    ADD CONSTRAINT "queue_numbers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: queue_numbers queue_numbers_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.queue_numbers
    ADD CONSTRAINT "queue_numbers_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: queue_numbers queue_numbers_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.queue_numbers
    ADD CONSTRAINT "queue_numbers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registrations registrations_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations registrations_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations registrations_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations registrations_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.service_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: services services_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: site_settings site_settings_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT "site_settings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_clinics user_clinics_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.user_clinics
    ADD CONSTRAINT "user_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public.clinics(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_clinics user_clinics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.user_clinics
    ADD CONSTRAINT "user_clinics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vital_signs vital_signs_medicalRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic
--

ALTER TABLE ONLY public.vital_signs
    ADD CONSTRAINT "vital_signs_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES public.medical_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: clinic
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

