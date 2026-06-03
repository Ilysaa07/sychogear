"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";
import { WORLDWIDE_COUNTRIES, getCountryByCode } from "@/lib/countries";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { State, City } from "country-state-city";
import {
  HiOutlineShoppingBag,
  HiOutlineGlobeAlt,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiChevronDown,
} from "react-icons/hi";
import CopyButton from "@/components/store/CopyButton";


export default function CheckoutPage() { return (<div></div>); }