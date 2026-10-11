# 📖 Algorithmic Phone Directory (DSA Mini Project)

A high-performance, interactive **Phone Directory web application** built from scratch using pure **HTML, CSS, and Vanilla JavaScript** (zero external libraries or frameworks). 

This project was built to demonstrate core **Data Structures and Algorithms (DSA)** in a real-world software architecture. None of JavaScript's built-in collections (`Map`, `Set`) or sorting methods (`Array.prototype.sort`) are used for core logic—every data structure, collision handling mechanism, and sorting algorithm is custom-built.

---

## 📌 Project Overview

Traditional phone book applications often use brute-force arrays or database indexes. In this project, specialized data structures were implemented from scratch to achieve optimal Big-O performance across distinct lookup modalities:

1. **Live Prefix Search (Autocomplete):** Powered by a **Tree (Prefix Tree)** for instantaneous character-by-character autocomplete as the user types.
2. **Exact Phone Lookup:** Powered by a **Custom Hash Table** with a polynomial rolling hash function and **Separate Chaining (Singly Linked List)** for collision resolution. Includes support for input formats with `+91`, spaces, and dashes.
3. **Alphabetical Directory Listing:** Powered by a recursive **Merge Sort** (stable $O(N \log N)$ divide-and-conquer).
4. **Exact Name Search:** Powered by an iterative **Binary Search** ($O(\log N)$) operating on the Merge Sorted contact list.
5. **Interactive DSA Telemetry & Visualizer:** Displays real-time algorithm execution metrics, Big-O complexity badges, microsecond execution timers (`performance.now()`), and a live 53-bucket Hash Table distribution map.

---

## 🚀 How to Run the Project

This project has **no dependencies**, requires **no build step**, and requires **no npm install**.

### Option 1: Direct Browser Launch (Simplest)
1. Double-click [index.html](file:///d:/Codes/DSA%20mini%20Project/index.html) in your file explorer, or right-click and choose **Open with > Chrome / Edge / Firefox / Safari**.

### Option 2: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click [index.html](file:///d:/Codes/DSA%20mini%20Project/index.html) and select **Open with Live Server**.

### Option 3: Local Python HTTP Server
Open your terminal in the project directory and run:
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

---

## 📂 Project Structure

```
d:/Codes/DSA mini Project/
├── index.html     # Semantic UI layout, forms, tabs, telemetry badges & visualizer
├── style.css      # Clean, modern, responsive styling, color palette, badges & layout
├── script.js     # Custom Tree, Hash Table, Merge Sort, Binary Search & UI controller
└── README.md      # Comprehensive DSA documentation, complexity table, viva guide
```

---

## 🧠 Data Structures & Algorithms Deep Dive

### 1. Tree (Prefix Tree) — Live Name Autocomplete
* **Why Use It?** Searching an unsorted or sorted array of $N$ contacts for prefix matches takes $O(N \cdot L)$ time. A Tree preprocesses strings into an $n$-ary tree where common prefixes share common ancestor paths. Finding all contacts starting with prefix length $L$ takes only $O(L + K)$ time (where $K$ is the number of nodes in the matching subtree), completely independent of total contacts $N$.
* **Implementation Details:**
  * Node: `TreeNode` contains `children` (plain JavaScript object character dictionary, no `Map`/`Set`), `isEndOfWord` flag, and a `contacts` list.
  * Autocomplete: Traverses $L$ prefix edges to locate the prefix root, then performs Depth-First Search (DFS) to collect all terminal contacts.
  * Deletion: Recursively prunes unused character branches when contacts are deleted, preventing memory leaks.
* **Complexities:**
  * **Insertion:** $O(L)$ time, $O(L)$ space.
  * **Prefix Search:** $O(L + K)$ time.
  * **Deletion:** $O(L)$ time.
  * **Overall Space:** $O(N \cdot L)$ worst case.

---

### 2. Custom Hash Table — Exact Phone Number Lookup
* **Why Use It?** Phone numbers are unique 10-digit identifiers. A Hash Table provides instantaneous average $O(1)$ lookup, insertion, and deletion.
* **Key Normalization:** Input is sanitized before indexing and lookup (`cleanPhoneNumber` strips `+91`, `91`, whitespace, and hyphens so both `+91 98230 12345` and `9823012345` resolve consistently). Phone numbers are strictly treated and stored as strings.
* **Hash Function:** Polynomial Rolling Hash with prime base $P = 31$ and prime capacity $M = 53$:
  $$\text{hash}(key) = \left( \sum_{i=0}^{L-1} \text{key}[i] \times 31^{L-1-i} \right) \bmod 53$$
  Using prime numbers ($31$ and $53$) drastically reduces clustering and distributes uniform hash values across numeric keys.
* **Collision Resolution:** **Separate Chaining** using custom `HashNode` singly linked list nodes (`key`, `value`, `next`). When multiple phone numbers hash to the same bucket index, they form a linked list chain. Exact key equality is verified with strict `===` string comparison.
* **Complexities:**
  * **Insertion:** Average $O(1)$, Worst $O(N)$ (all keys collide into one bucket).
  * **Lookup:** Average $O(1)$, Worst $O(N)$.
  * **Deletion:** Average $O(1)$, Worst $O(N)$.
  * **Space Complexity:** $O(M + N)$ where $M = 53$ buckets, $N =$ total contacts.

---

### 3. Merge Sort — Alphabetical Directory Listing
* **Why Use It?** QuickSort has an $O(N^2)$ worst-case on already sorted or reverse data. Merge Sort provides a **guaranteed $O(N \log N)$** upper bound across all cases (best, average, worst). Additionally, Merge Sort is **stable**—it preserves the relative input order of identical elements.
* **Algorithm Mechanism:**
  1. **Divide:** Recursively divide the contact array into two halves until single-element arrays remain ($T(N) = 2T(N/2)$).
  2. **Conquer:** Recursively sort each sub-array.
  3. **Combine:** Merge two sorted sub-arrays into a single sorted array by comparing front elements in $O(N)$ linear time.
* **Recurrence Relation:**
  $$T(N) = 2T\left(\frac{N}{2}\right) + O(N) \implies O(N \log N) \quad \text{(via Master Theorem)}$$
* **Complexities:**
  * **Time Complexity:** $O(N \log N)$ in best, average, and worst cases.
  * **Space Complexity:** $O(N)$ auxiliary space for merge sub-arrays.

---

### 4. Binary Search — Exact Name Lookup
* **Why Use It?** Given an array already sorted alphabetically by Merge Sort, Binary Search eliminates half of the remaining search space with each comparison. For $N = 1,000,000$ contacts, Binary Search takes at most $\approx 20$ comparisons.
* **Algorithm Mechanism:**
  * Maintains `low` and `high` pointers.
  * Computes `mid = low + Math.floor((high - low) / 2)` to eliminate integer overflow.
  * Compares target string with `mid.name.toLowerCase()`.
  * If equal $\implies$ contact found.
  * If target is lexicographically smaller $\implies$ set `high = mid - 1`.
  * Otherwise $\implies$ set `low = mid + 1`.
* **Complexities:**
  * **Time Complexity:** $O(\log N)$ in average and worst cases, $O(1)$ best case.
  * **Space Complexity:** $O(1)$ iterative memory.

---

## 📊 Comprehensive Complexity Matrix

| Operation | Primary Algorithm / Structure | Best Time | Average Time | Worst Time | Space Complexity | Why Chosen? |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Prefix Autocomplete** | **Tree (Prefix Tree)** | $O(L)$ | $O(L + K)$ | $O(L + K)$ | $O(N \cdot L)$ | Real-time keystroke suggestions independent of directory size $N$. |
| **Phone Number Lookup** | **Hash Table (Separate Chaining)** | $O(1)$ | $O(1)$ | $O(N)$ | $O(M + N)$ | Direct bucket indexing using polynomial rolling hash. |
| **Directory Sorting** | **Merge Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Guaranteed $O(N \log N)$ and stable sorting for A-Z display. |
| **Exact Name Search** | **Binary Search** | $O(1)$ | $O(\log N)$ | $O(\log N)$ | $O(1)$ | Logarithmic search over Merge-sorted array. |
| **Contact Insertion** | **Tree + Hash Table + Merge Sort** | $O(L + 1)$ | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Synchronizes all 3 structures; checks phone duplicate in $O(1)$. |
| **Contact Deletion** | **Tree + Hash Table + Array Filter** | $O(L + 1)$ | $O(N)$ | $O(N)$ | $O(1)$ | Recursive branch cleanup in Tree, linked list node bypass in Hash Table. |

*Notation:*
- $N$: Total number of contacts in the directory.
- $L$: Length of the contact name or search prefix.
- $K$: Number of nodes in the matched Tree subtree.
- $M$: Number of hash buckets (fixed prime capacity $M = 53$).

---

## 🎓 Viva Questions & Model Answers

### Q1: Why did you choose a Tree (Prefix Tree) instead of a Hash Table for name search?
> **Answer:** A Hash Table requires the exact full key to compute an index ($O(1)$ for exact match), but it **cannot perform prefix searches or autocompletion efficiently** because hashing randomizes the distribution of strings with common prefixes. A Tree naturally preserves character prefixes in tree hierarchies, allowing prefix lookup in $O(L + K)$ where $L$ is the prefix length and $K$ is the number of matching results, completely independent of the total contact count $N$.

### Q2: Why use prime numbers for the Hash Table capacity and polynomial base?
> **Answer:** We used prime capacity $M = 53$ and prime base $P = 31$. In modular arithmetic, coprime numbers minimize common divisors with character code sequences, preventing systematic collisions and producing a uniform hash distribution across phone number strings.

### Q3: How do you handle collisions in your custom Hash Table?
> **Answer:** Through **Separate Chaining**. Each bucket in the table array holds the head of a singly linked list (`HashNode`). When two phone numbers hash to the same bucket index, the new node is prepended to the bucket's linked list chain in $O(1)$ time. Lookup traverses the chain comparing exact keys.

### Q4: Why Merge Sort over QuickSort for displaying the directory?
> **Answer:** QuickSort has an $O(N^2)$ worst-case time complexity if the partition pivot is poorly chosen (e.g., when the array is already sorted or reverse-sorted). Merge Sort guarantees $O(N \log N)$ performance in **all** cases (best, average, and worst). In addition, Merge Sort is **stable**, preserving the existing order of records.

### Q5: How do you keep all data structures in sync when a contact is deleted?
> **Answer:** When `deleteContact(id)` is called:
> 1. It locates the contact object.
> 2. Calls `tree.delete(name, id)` which uses recursive backtracking to unset `isEndOfWord` and prune empty character child nodes.
> 3. Calls `hashTable.delete(cleanPhone)` which traverses the bucket's linked list and unlinks the node by pointer manipulation (`prev.next = current.next`).
> 4. Removes the record from the contact list array and re-executes `mergeSort` to refresh the sorted view.

---

## 🧪 Sample Demo Data Included

The directory comes preloaded with **30 realistic Indian dummy contacts** designed specifically to showcase prefix clustering:
- **"Am-" prefix:** *Aman Sharma, Amit Patel, Amey Joshi*
- **"An-" prefix:** *Ananya Verma, Anjali Gupta, Ankit Tiwari*
- **"Ak-" & "Al-" prefixes:** *Akash Roy, Alok Mishra*
- **"Poo-" & "Pr-" prefixes:** *Pooja Mehta, Poonam Reddy, Pranav Rao, Priyanka Nair, Prateek Singh*
- **"Roh-" & "Ri-" prefixes:** *Rohan Kulkarni, Rohit Malhotra, Riya Sen, Ritu Das, Rajesh Iyer*
- **"Si-" & "Sn-" prefixes:** *Siddharth Jain, Simran Kaur, Sneha Roy, Sourabh Ghosh, Sunita Patil*
- **"Vi-" prefix:** *Vikas Kumar, Vikram Rathore, Vishal Deshmukh, Varun Chopra, Vidya Bhat*

You can also click **"+10 Random Contacts"** to dynamically generate and insert new mock contacts, or click **"Reset Default 30"** at any time.
