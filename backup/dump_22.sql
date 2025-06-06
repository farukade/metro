PGDMP                       |            metro    16.1    16.1                0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                        0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            !           1262    242969    metro    DATABASE     g   CREATE DATABASE metro WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';
    DROP DATABASE metro;
                postgres    false                        2615    267257    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                postgres    false            "           0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                   postgres    false    5            #           0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                   postgres    false    5            �            1259    267275    transaction    TABLE     �  CREATE TABLE public.transaction (
    id integer NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    status boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text DEFAULT 'admin'::text NOT NULL,
    "lastChangedBy" text,
    mode text NOT NULL,
    "unitValue" integer NOT NULL
);
    DROP TABLE public.transaction;
       public         heap    postgres    false    5            �            1259    267274    transaction_id_seq    SEQUENCE     �   CREATE SEQUENCE public.transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.transaction_id_seq;
       public          postgres    false    218    5            $           0    0    transaction_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.transaction_id_seq OWNED BY public.transaction.id;
          public          postgres    false    217            �            1259    267259    user    TABLE     �  CREATE TABLE public."user" (
    id integer NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    occupation text,
    "companyName" text,
    email text NOT NULL,
    salary integer,
    "unitBalance" integer DEFAULT 0 NOT NULL,
    "openingBalance" integer DEFAULT 100 NOT NULL,
    "idNo" text,
    phone text,
    address text,
    image text DEFAULT 'placeholder.jpg'::text NOT NULL,
    type text DEFAULT 'user'::text NOT NULL,
    status boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text DEFAULT 'admin'::text NOT NULL,
    "lastChangedBy" text
);
    DROP TABLE public."user";
       public         heap    postgres    false    5            �            1259    267258    user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 "   DROP SEQUENCE public.user_id_seq;
       public          postgres    false    5    216            %           0    0    user_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;
          public          postgres    false    215            �           2604    267278    transaction id    DEFAULT     p   ALTER TABLE ONLY public.transaction ALTER COLUMN id SET DEFAULT nextval('public.transaction_id_seq'::regclass);
 =   ALTER TABLE public.transaction ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    217    218    218            x           2604    267262    user id    DEFAULT     d   ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);
 8   ALTER TABLE public."user" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    216    215    216                      0    267275    transaction 
   TABLE DATA           �   COPY public.transaction (id, amount, description, date, status, "createdAt", "updatedAt", "createdBy", "lastChangedBy", mode, "unitValue") FROM stdin;
    public          postgres    false    218   �                 0    267259    user 
   TABLE DATA           �   COPY public."user" (id, password, "firstName", "lastName", occupation, "companyName", email, salary, "unitBalance", "openingBalance", "idNo", phone, address, image, type, status, "createdAt", "updatedAt", "createdBy", "lastChangedBy") FROM stdin;
    public          postgres    false    216   �       &           0    0    transaction_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.transaction_id_seq', 5, true);
          public          postgres    false    217            '           0    0    user_id_seq    SEQUENCE SET     9   SELECT pg_catalog.setval('public.user_id_seq', 2, true);
          public          postgres    false    215            �           2606    267285    transaction transaction_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.transaction DROP CONSTRAINT transaction_pkey;
       public            postgres    false    218            �           2606    267273    user user_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public."user" DROP CONSTRAINT user_pkey;
       public            postgres    false    216            �           1259    267286    user_email_key    INDEX     I   CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);
 "   DROP INDEX public.user_email_key;
       public            postgres    false    216               �   x�}�An� ��p
.`4v��R)�]�^f�i�E]���U�ER����O_ D��t��|z9/#hԶB��I�8���$�"q䠨��o��5l;�N�Nn��>��!���v6�L	v�?T�����'5sB��4|���|퇏�f*�>��ƫ���/�Y�j�M���^���B�n�ϺCd�&��f;u~��j��m��.@켰���'Z�Պ�DV�\|n^��%��Q�~Z         '  x�u�Ko�0��ίȁ#�	PrL��(��T��8���:��G��Z��JHsX����àF�F5y��Kwy�����)�f�8��XV�5��	���S��G�����C0�f��5`7�(���j���YrI�]�(x�f���nz<�����I�
��9a�%����)�ϣL\���!�
h@�761qZ��;�E��>�8��r���oݭ��-�v��.}��s�7���Q�6����{��.�(���}��{��{���#�\�e�:6q�6|����;h��G�z     