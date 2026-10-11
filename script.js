/**
 * ============================================================================
 * ALGORITHMIC PHONE DIRECTORY
 * Data Structures & Algorithms Implementation in Pure JavaScript
 * 
 * CORE DATA STRUCTURES IMPLEMENTED FROM SCRATCH:
 * 1. Tree (Prefix Tree)              -> Autocomplete prefix search by name
 * 2. Hash Table (Separate Chaining)  -> O(1) exact lookup by 10-digit phone number
 * 3. Merge Sort                      -> O(N log N) stable sorting of contacts A-Z
 * 4. Binary Search                   -> O(log N) exact name search on sorted array
 * 
 * (NO built-in Map, Set, or Array.prototype.sort used for core logic)
 * ============================================================================
 */

/* ============================================================================
 * PHONE NUMBER SANITIZER UTILITY
 * Normalizes any phone input into a clean 10-digit string.
 * Strips leading +91 or 91, spaces, dashes, parentheses, and non-numeric chars.
 * ============================================================================ */
function cleanPhoneNumber(rawPhone) {
  if (rawPhone === null || rawPhone === undefined) return '';
  let str = String(rawPhone).trim();
  // Remove spaces, hyphens, brackets, dots
  str = str.replace(/[\s\-\(\)\.]/g, '');
  // Remove international prefix +91
  if (str.startsWith('+91')) {
    str = str.slice(3);
  } else if (str.startsWith('91') && str.length > 10) {
    str = str.slice(2);
  }
  // Strip any remaining non-digit characters
  str = str.replace(/\D/g, '');
  return str;
}

/* ============================================================================
 * 1. CONTACT ENTITY MODEL
 * ============================================================================ */
class Contact {
  /**
   * Represents a single directory contact.
   * @param {string} id - Unique identifier (timestamp + random string)
   * @param {string} name - Contact full name
   * @param {string} phone - 10-digit mobile number string
   * @param {string} category - Category tag (College, Friends, Work, Family, General)
   */
  constructor(id, name, phone, category = 'College') {
    this.id = id;
    this.name = name.trim();
    this.phone = cleanPhoneNumber(phone);
    this.category = category;
    this.createdAt = Date.now();
  }
}

/* ============================================================================
 * 2. TREE (PREFIX TREE) IMPLEMENTATION
 * ============================================================================
 * 
 * VIVA EXPLANATION:
 * - Why Tree (Prefix Tree)?
 *   A standard array search for prefix takes O(N * L) where N is number of contacts
 *   and L is prefix length. A Tree preprocesses strings such that locating all
 *   words with prefix of length L takes only O(L + K) time, where K is the number
 *   of matching nodes in the subtree, completely INDEPENDENT of total contacts N!
 * 
 * - Complexities:
 *   - Insertion: O(L) time, where L is the length of the contact's name.
 *   - Prefix Search: O(L + K) time, where L = prefix length, K = matching subtree nodes.
 *   - Deletion: O(L) time, with recursive pruning of empty branches.
 *   - Space Complexity: O(N * L) in the worst case (branching factor bounded by alphabet).
 * ============================================================================ */

class TreeNode {
  constructor() {
    // Plain JavaScript object used as a character map (NO ES6 Map/Set used)
    // Keys are single lowercase characters; values are child TreeNode instances.
    this.children = {};

    // Indicates whether one or more contact names terminate at this exact node.
    this.isEndOfWord = false;

    // Array of Contact references that end at this node.
    // (Handles potential same-name variations or multiple records)
    this.contacts = [];
  }
}

class Tree {
  constructor() {
    this.root = new TreeNode();
    this.nodeCount = 1; // root node
  }

  /**
   * Inserts a contact name into the Tree.
   * Time Complexity: O(L) where L = name.length
   * Space Complexity: O(L) in the worst case if all characters are new nodes
   * 
   * @param {string} name - Name to insert
   * @param {Contact} contact - Reference to the contact object
   */
  insert(name, contact) {
    let current = this.root;
    const cleanName = name.trim().toLowerCase();

    for (let i = 0; i < cleanName.length; i++) {
      const char = cleanName[i];
      if (!current.children[char]) {
        current.children[char] = new TreeNode();
        this.nodeCount++;
      }
      current = current.children[char];
    }

    current.isEndOfWord = true;
    current.contacts.push(contact);
  }

  /**
   * Searches for all contacts matching a given prefix.
   * Time Complexity: O(L + K) where:
   *   - L is prefix length (to reach the prefix root)
   *   - K is number of nodes in the subtree explored to collect words
   * 
   * @param {string} prefix - The search prefix
   * @returns {{ results: Contact[], steps: number, nodesExplored: number, durationMs: number }}
   */
  searchPrefix(prefix) {
    const startTime = performance.now();
    let current = this.root;
    const cleanPrefix = prefix.trim().toLowerCase();
    let steps = 0;
    let nodesExplored = 0;

    // Phase 1: Traverse the prefix path
    for (let i = 0; i < cleanPrefix.length; i++) {
      const char = cleanPrefix[i];
      steps++;
      if (!current.children[char]) {
        return {
          results: [],
          steps,
          nodesExplored,
          durationMs: performance.now() - startTime
        };
      }
      current = current.children[char];
    }

    // Phase 2: Depth-First Search (DFS) from prefix node to gather all contacts
    const results = [];
    const dfs = (node) => {
      nodesExplored++;
      if (node.isEndOfWord) {
        for (let i = 0; i < node.contacts.length; i++) {
          results.push(node.contacts[i]);
        }
      }
      // Explore all character children
      const keys = Object.keys(node.children);
      for (let i = 0; i < keys.length; i++) {
        dfs(node.children[keys[i]]);
      }
    };

    dfs(current);

    return {
      results,
      steps,
      nodesExplored,
      durationMs: performance.now() - startTime
    };
  }

  /**
   * Deletes a contact from the Tree and recursively prunes unused nodes.
   * Time Complexity: O(L) where L = name.length
   * 
   * @param {string} name - Contact name
   * @param {string} contactId - Unique contact ID to remove
   * @returns {boolean} Whether deletion was successful
   */
  delete(name, contactId) {
    const cleanName = name.trim().toLowerCase();
    let deleted = false;

    const deleteHelper = (node, depth) => {
      if (!node) return false;

      // Base case: reached end of the name
      if (depth === cleanName.length) {
        if (!node.isEndOfWord) return false;

        // Filter out this specific contact ID without built-in Set/Map
        const filtered = [];
        for (let i = 0; i < node.contacts.length; i++) {
          if (node.contacts[i].id !== contactId) {
            filtered.push(node.contacts[i]);
          } else {
            deleted = true;
          }
        }
        node.contacts = filtered;

        if (node.contacts.length === 0) {
          node.isEndOfWord = false;
        }

        // Return true if node has no children (can be safely pruned by parent)
        return Object.keys(node.children).length === 0 && !node.isEndOfWord;
      }

      const char = cleanName[depth];
      const childNode = node.children[char];
      if (!childNode) return false;

      const shouldPruneChild = deleteHelper(childNode, depth + 1);

      if (shouldPruneChild) {
        delete node.children[char];
        this.nodeCount--;
        // Prune current node if it has no other children and is not a word end
        return Object.keys(node.children).length === 0 && !node.isEndOfWord;
      }

      return false;
    };

    deleteHelper(this.root, 0);
    return deleted;
  }
}

/* ============================================================================
 * 3. HASH TABLE WITH SEPARATE CHAINING (CUSTOM IMPLEMENTATION)
 * ============================================================================
 * 
 * VIVA EXPLANATION:
 * - Why Custom Hash Table?
 *   Gives O(1) average time complexity for exact lookup by phone number!
 * - Collision Resolution:
 *   Separate Chaining using custom Singly Linked List nodes (HashNode).
 *   When two different phone numbers hash to the same bucket index, they form
 *   a linked list chain in that bucket.
 * - Hash Function:
 *   Polynomial Rolling Hash with prime base 31 and prime capacity (e.g. 53).
 *   Formula: hash = (hash * 31 + charCode) mod capacity
 *   Using prime numbers minimizes clustered collisions across digit strings.
 * 
 * - Complexities:
 *   - Insertion: O(1) average, O(N) worst case (if all keys collide).
 *   - Lookup: O(1) average, O(N) worst case.
 *   - Deletion: O(1) average, O(N) worst case.
 *   - Space Complexity: O(M + N) where M is bucket count and N is total keys.
 * ============================================================================ */

class HashNode {
  /**
   * Linked list node for collision chaining.
   * @param {string} key - The 10-digit phone number string
   * @param {Contact} value - The contact object
   * @param {HashNode|null} next - Pointer to the next node in chain
   */
  constructor(key, value, next = null) {
    this.key = String(key);
    this.value = value;
    this.next = next;
  }
}

class HashTable {
  /**
   * @param {number} capacity - Prime bucket capacity (defaults to 53)
   */
  constructor(capacity = 53) {
    this.capacity = capacity;
    // Buckets array initialized to null (NO Map or Set used)
    this.buckets = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.buckets[i] = null;
    }
    this.size = 0; // Total key-value pairs stored
  }

  /**
   * Polynomial Rolling Hash Function.
   * Computes: (sum of charCode * 31^(L-1-i)) mod capacity
   * Guaranteed to return an integer index in range [0, capacity - 1]
   * 
   * @param {string} key - Key string (10-digit phone)
   * @returns {number} Bucket index in range [0, capacity - 1]
   */
  hash(key) {
    const P = 31;
    let hashVal = 0;
    const strKey = String(key).trim();
    if (strKey.length === 0) return 0;

    for (let i = 0; i < strKey.length; i++) {
      hashVal = (hashVal * P + strKey.charCodeAt(i)) % this.capacity;
    }

    // Mathematical guarantee against negative modulo or NaN
    hashVal = (hashVal % this.capacity + this.capacity) % this.capacity;
    return Math.floor(hashVal);
  }

  /**
   * Inserts or updates a phone number mapping in the Hash Table.
   * Average Time: O(1)
   * Worst Case Time: O(N)
   * 
   * @param {string} key - 10-digit phone number string
   * @param {Contact} value - Contact object
   * @returns {{ bucketIndex: number, collisions: number, updated: boolean }}
   */
  insert(key, value) {
    const cleanKey = String(key).trim();
    const index = this.hash(cleanKey);
    let current = this.buckets[index];
    let collisions = 0;

    // Check if key already exists in this chain (update case)
    while (current !== null) {
      if (current.key === cleanKey) {
        current.value = value;
        return { bucketIndex: index, collisions, updated: true };
      }
      collisions++;
      current = current.next;
    }

    // Insert new node at head of chain (O(1) insertion)
    const newNode = new HashNode(cleanKey, value, this.buckets[index]);
    this.buckets[index] = newNode;
    this.size++;

    return { bucketIndex: index, collisions, updated: false };
  }

  /**
   * Searches for a contact by exact phone number.
   * Walks the entire chain in the bucket and compares with ===.
   * Average Time: O(1)
   * Worst Case Time: O(N)
   * 
   * @param {string} key - 10-digit phone number string
   * @returns {{ contact: Contact|null, bucketIndex: number, steps: number, chainLength: number, collisions: number, durationMs: number }}
   */
  search(key) {
    const startTime = performance.now();
    const cleanKey = String(key).trim();
    const index = this.hash(cleanKey);
    let current = this.buckets[index];
    let steps = 0;
    let chainLength = 0;

    // Calculate total chain length in this bucket
    let counter = this.buckets[index];
    while (counter !== null) {
      chainLength++;
      counter = counter.next;
    }

    // Traverse the chain comparing exact key
    while (current !== null) {
      steps++;
      if (current.key === cleanKey) {
        return {
          contact: current.value,
          bucketIndex: index,
          steps,
          chainLength,
          collisions: chainLength > 1 ? chainLength - 1 : 0,
          durationMs: performance.now() - startTime
        };
      }
      current = current.next;
    }

    return {
      contact: null,
      bucketIndex: index,
      steps,
      chainLength,
      collisions: chainLength > 1 ? chainLength - 1 : 0,
      durationMs: performance.now() - startTime
    };
  }

  /**
   * Deletes a contact entry by phone number from the linked list chain.
   * Average Time: O(1)
   * Worst Case Time: O(N)
   * 
   * @param {string} key - Phone number string
   * @returns {boolean} Whether node was found and removed
   */
  delete(key) {
    const cleanKey = String(key).trim();
    const index = this.hash(cleanKey);
    let current = this.buckets[index];
    let prev = null;

    while (current !== null) {
      if (current.key === cleanKey) {
        if (prev === null) {
          // Deleting head node
          this.buckets[index] = current.next;
        } else {
          // Bypassing current node
          prev.next = current.next;
        }
        this.size--;
        return true;
      }
      prev = current;
      current = current.next;
    }

    return false;
  }

  /**
   * Inspects table statistics for viva inspection and visualizer.
   */
  getDiagnostics() {
    let filledBuckets = 0;
    let collisionBuckets = 0;
    let maxChainLength = 0;
    const bucketLengths = new Array(this.capacity);

    for (let i = 0; i < this.capacity; i++) {
      let chainLen = 0;
      let curr = this.buckets[i];
      while (curr !== null) {
        chainLen++;
        curr = curr.next;
      }
      bucketLengths[i] = chainLen;
      if (chainLen > 0) filledBuckets++;
      if (chainLen > 1) collisionBuckets++;
      if (chainLen > maxChainLength) maxChainLength = chainLen;
    }

    const loadFactor = (this.size / this.capacity).toFixed(2);

    return {
      capacity: this.capacity,
      size: this.size,
      filledBuckets,
      emptyBuckets: this.capacity - filledBuckets,
      collisionBuckets,
      maxChainLength,
      loadFactor,
      bucketLengths
    };
  }
}

/* ============================================================================
 * 4. MERGE SORT (CUSTOM RECURSIVE IMPLEMENTATION)
 * ============================================================================
 * 
 * VIVA EXPLANATION:
 * - Why Merge Sort?
 *   Merge Sort is a Divide-and-Conquer algorithm with GUARANTEED O(N log N)
 *   time complexity in ALL cases (best, average, worst). Unlike QuickSort which
 *   degrades to O(N^2) on sorted/reverse data, Merge Sort is rock-solid.
 *   Furthermore, Merge Sort is STABLE (preserves original order of duplicates).
 * 
 * - Complexities:
 *   - Time Complexity: O(N log N) in best, average, and worst cases.
 *   - Space Complexity: O(N) auxiliary space for temporary merge buffers.
 * ============================================================================ */

function mergeSort(arr, compareFn) {
  // Base case: arrays of length 0 or 1 are already sorted
  if (arr.length <= 1) {
    return arr;
  }

  // Divide step: compute midpoint and split into two halves
  const mid = Math.floor(arr.length / 2);
  const leftHalf = [];
  const rightHalf = [];

  for (let i = 0; i < mid; i++) {
    leftHalf.push(arr[i]);
  }
  for (let i = mid; i < arr.length; i++) {
    rightHalf.push(arr[i]);
  }

  // Conquer step: recursively sort both sub-arrays
  const sortedLeft = mergeSort(leftHalf, compareFn);
  const sortedRight = mergeSort(rightHalf, compareFn);

  // Combine step: merge two sorted sub-arrays
  return merge(sortedLeft, sortedRight, compareFn);
}

function merge(left, right, compareFn) {
  const result = [];
  let i = 0;
  let j = 0;

  // Compare elements from both halves and push the smaller one
  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // Append any remaining elements from the left sub-array
  while (i < left.length) {
    result.push(left[i]);
    i++;
  }

  // Append any remaining elements from the right sub-array
  while (j < right.length) {
    result.push(right[j]);
    j++;
  }

  return result;
}

/**
 * Contact name comparator for alphabetical ordering (A-Z or Z-A).
 */
function compareContactsByName(a, b, ascending = true) {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  if (nameA < nameB) return ascending ? -1 : 1;
  if (nameA > nameB) return ascending ? 1 : -1;
  return 0;
}

/* ============================================================================
 * 5. BINARY SEARCH (CUSTOM ITERATIVE IMPLEMENTATION)
 * ============================================================================
 * 
 * VIVA EXPLANATION:
 * - Why Binary Search?
 *   Linear search takes O(N). When the contact list is sorted alphabetically
 *   (via Merge Sort), Binary Search cuts the search space in HALF at each step.
 *   For 1,000,000 contacts, Binary Search takes at most ~20 comparisons!
 * 
 * - Complexities:
 *   - Time Complexity: O(log N) where N is number of contacts.
 *   - Space Complexity: O(1) auxiliary space (iterative implementation).
 * ============================================================================ */

function binarySearchExactName(sortedContacts, targetName) {
  const startTime = performance.now();
  const cleanTarget = targetName.trim().toLowerCase();

  let low = 0;
  let high = sortedContacts.length - 1;
  let comparisons = 0;

  while (low <= high) {
    comparisons++;
    // Avoid integer overflow mathematically: low + floor((high - low) / 2)
    const mid = Math.floor(low + (high - low) / 2);
    const midName = sortedContacts[mid].name.trim().toLowerCase();

    if (midName === cleanTarget) {
      return {
        contact: sortedContacts[mid],
        index: mid,
        comparisons,
        found: true,
        durationMs: performance.now() - startTime
      };
    } else if (cleanTarget < midName) {
      high = mid - 1; // Target must be in left half
    } else {
      low = mid + 1;  // Target must be in right half
    }
  }

  return {
    contact: null,
    index: -1,
    comparisons,
    found: false,
    durationMs: performance.now() - startTime
  };
}

/* ============================================================================
 * 6. PHONE DIRECTORY CONTROLLER
 * Synchronizes Tree, Hash Table, and Merge Sorted Array
 * ============================================================================ */

class PhoneDirectory {
  constructor() {
    this.tree = new Tree();
    this.hashTable = new HashTable(53);
    this.contacts = [];      // Raw array
    this.sortedContacts = [];// Array maintained in sorted order via Merge Sort
  }

  /**
   * Adds a new contact into all 3 data structures.
   * Validation & Synchronization:
   * 1. Check for duplicate phone number via Hash Table in O(1)
   * 2. Insert into Tree in O(L)
   * 3. Insert into Hash Table in O(1)
   * 4. Add to array and re-sort via Merge Sort in O(N log N)
   */
  addContact(name, phone, category = 'College') {
    // Clean and validate 10-digit numeric check
    const cleanPhone = cleanPhoneNumber(phone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.");
    }

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      throw new Error("Name must have at least 2 characters.");
    }

    // Duplicate Check using Hash Table (O(1))
    const existingCheck = this.hashTable.search(cleanPhone);
    if (existingCheck.contact !== null) {
      throw new Error(`Phone number ${cleanPhone} already belongs to "${existingCheck.contact.name}".`);
    }

    // Create unique ID
    const id = 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newContact = new Contact(id, cleanName, cleanPhone, category);

    // 1. Insert into Tree
    this.tree.insert(cleanName, newContact);

    // 2. Insert into Hash Table
    this.hashTable.insert(cleanPhone, newContact);

    // 3. Add to contact list
    this.contacts.push(newContact);

    // 4. Update sorted directory using Merge Sort
    this.refreshSortedList();

    return newContact;
  }

  /**
   * Deletes contact consistently across Tree, Hash Table, and sorted list.
   */
  deleteContact(contactId) {
    let targetContact = null;
    let targetIndex = -1;

    for (let i = 0; i < this.contacts.length; i++) {
      if (this.contacts[i].id === contactId) {
        targetContact = this.contacts[i];
        targetIndex = i;
        break;
      }
    }

    if (!targetContact) return false;

    // 1. Delete from Tree
    this.tree.delete(targetContact.name, contactId);

    // 2. Delete from Hash Table
    this.hashTable.delete(cleanPhoneNumber(targetContact.phone));

    // 3. Remove from raw array
    this.contacts.splice(targetIndex, 1);

    // 4. Update sorted directory using Merge Sort
    this.refreshSortedList();

    return true;
  }

  /**
   * Re-sorts contacts using custom Merge Sort.
   */
  refreshSortedList(ascending = true) {
    const startTime = performance.now();
    this.sortedContacts = mergeSort(this.contacts, (a, b) => compareContactsByName(a, b, ascending));
    return {
      count: this.sortedContacts.length,
      durationMs: performance.now() - startTime
    };
  }

  /**
   * Prefix search by name via Tree.
   */
  searchPrefix(prefix) {
    return this.tree.searchPrefix(prefix);
  }

  /**
   * Exact name search via Binary Search on sorted contacts.
   */
  searchExactName(targetName) {
    return binarySearchExactName(this.sortedContacts, targetName);
  }

  /**
   * Phone lookup via Hash Table.
   */
  searchPhone(phone) {
    const cleanPhone = cleanPhoneNumber(phone);
    return this.hashTable.search(cleanPhone);
  }
}

/* ============================================================================
 * 7. SAMPLE DATA: 30 PRELOADED INDIAN CONTACTS WITH OVERLAPPING PREFIXES
 * ============================================================================ */

const PRELOADED_SAMPLE_DATA = [
  // Shared prefix 'Am-'
  { name: "Aman Sharma", phone: "9823012345", category: "College" },
  { name: "Amit Patel", phone: "9823067890", category: "Work" },
  { name: "Amey Joshi", phone: "9823011223", category: "Friends" },

  // Shared prefix 'An-'
  { name: "Ananya Verma", phone: "9834123456", category: "College" },
  { name: "Anjali Gupta", phone: "9834156789", category: "Friends" },
  { name: "Ankit Tiwari", phone: "9834198765", category: "Work" },

  // Shared prefix 'Ak-' & 'Al-'
  { name: "Akash Roy", phone: "9745123456", category: "College" },
  { name: "Alok Mishra", phone: "9745167890", category: "General" },

  // Shared prefix 'Poo-' & 'Pr-'
  { name: "Pooja Mehta", phone: "9867012345", category: "Family" },
  { name: "Poonam Reddy", phone: "9867054321", category: "Friends" },
  { name: "Pranav Rao", phone: "8765412345", category: "Work" },
  { name: "Priyanka Nair", phone: "8765498765", category: "College" },
  { name: "Prateek Singh", phone: "8765432109", category: "College" },

  // Shared prefix 'Roh-' & 'Ri-'
  { name: "Rohan Kulkarni", phone: "9898012345", category: "Friends" },
  { name: "Rohit Malhotra", phone: "9898056789", category: "Work" },
  { name: "Riya Sen", phone: "9898098765", category: "College" },
  { name: "Ritu Das", phone: "9898034567", category: "Family" },
  { name: "Rajesh Iyer", phone: "9765432198", category: "Work" },

  // Shared prefix 'Si-' & 'Sn-' & 'So-'
  { name: "Siddharth Jain", phone: "9988776655", category: "College" },
  { name: "Simran Kaur", phone: "9988774433", category: "Friends" },
  { name: "Sneha Roy", phone: "9988772211", category: "College" },
  { name: "Sourabh Ghosh", phone: "9988771100", category: "Work" },
  { name: "Sunita Patil", phone: "9988779988", category: "Family" },

  // Shared prefix 'Vi-'
  { name: "Vikas Kumar", phone: "7890123456", category: "Work" },
  { name: "Vikram Rathore", phone: "7890167890", category: "Friends" },
  { name: "Vishal Deshmukh", phone: "7890198765", category: "College" },
  { name: "Varun Chopra", phone: "7890145678", category: "Work" },
  { name: "Vidya Bhat", phone: "7890111223", category: "College" },

  // Other common prefixes
  { name: "Kavita Pillai", phone: "8912345678", category: "Family" },
  { name: "Karan Kapoor", phone: "8912398765", category: "Friends" }
];

// Realistic Indian first & last names pool for generator
const RANDOM_FIRST_NAMES = [
  "Aditya", "Aarav", "Bhavna", "Chetan", "Deepak", "Divya", "Gaurav", 
  "Harsh", "Ishaan", "Kavya", "Manish", "Neha", "Nikhil", "Pallavi",
  "Rahul", "Rakesh", "Sanjay", "Tanvi", "Umesh", "Yash", "Zoya"
];
const RANDOM_LAST_NAMES = [
  "Agarwal", "Bose", "Chauhan", "Dubey", "Gandhi", "Jadhav", "Kapoor",
  "Mahajan", "Nambiar", "Pandey", "Rao", "Saxena", "Thakur", "Venkatesh"
];
const CATEGORIES = ["College", "Friends", "Work", "Family", "General"];

/**
 * Generates a random Indian 10-digit mobile number starting with 9, 8, or 7.
 */
function generateRandomPhoneNumber(directory) {
  const prefixes = ['9', '8', '7'];
  let phone;
  let attempts = 0;

  do {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let remaining = '';
    for (let i = 0; i < 9; i++) {
      remaining += Math.floor(Math.random() * 10);
    }
    phone = prefix + remaining;
    attempts++;
  } while (directory.hashTable.search(phone).contact !== null && attempts < 100);

  return phone;
}

/* ============================================================================
 * 8. UI CONTROLLER & EVENT LISTENERS
 * ============================================================================ */

// Global directory instance
const directory = new PhoneDirectory();

// DOM Elements
const statTotalContacts = document.getElementById('stat-total-contacts');
const statHashBuckets = document.getElementById('stat-hash-buckets');
const statTreeNodes = document.getElementById('stat-tree-nodes');

// Form
const addContactForm = document.getElementById('add-contact-form');
const contactNameInput = document.getElementById('contact-name');
const contactPhoneInput = document.getElementById('contact-phone');
const contactCategorySelect = document.getElementById('contact-category');
const formErrorMsg = document.getElementById('form-error-msg');

// Buttons
const btnLoadMore = document.getElementById('btn-load-more');
const btnResetData = document.getElementById('btn-reset-data');
const btnReMergeSort = document.getElementById('btn-re-mergesort');
const sortDirectionSelect = document.getElementById('sort-direction-select');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Tab 1: Name Search
const nameSearchInput = document.getElementById('name-search-input');
const clearNameSearch = document.getElementById('clear-name-search');
const btnExactBinarySearch = document.getElementById('btn-exact-binary-search');
const nameResultsList = document.getElementById('name-results-list');
const resultsCountHeading = document.getElementById('results-count-heading');
const resultsSubtext = document.getElementById('results-subtext');
const telemetryAlgoTitle = document.getElementById('telemetry-algo-title');
const telemetryComplexity = document.getElementById('telemetry-complexity');
const telemetryDescription = document.getElementById('telemetry-description');
const statPrefixLen = document.getElementById('stat-prefix-len');
const statMatchedCount = document.getElementById('stat-matched-count');
const statSearchTime = document.getElementById('stat-search-time');

// Tab 2: Phone Search
const phoneSearchInput = document.getElementById('phone-search-input');
const clearPhoneSearch = document.getElementById('clear-phone-search');
const btnHashSearch = document.getElementById('btn-hash-search');
const phoneResultCardContainer = document.getElementById('phone-result-card-container');
const statPhoneBucket = document.getElementById('stat-phone-bucket');
const statPhoneSteps = document.getElementById('stat-phone-steps');
const statPhoneCollisions = document.getElementById('stat-phone-collisions');
const statPhoneTime = document.getElementById('stat-phone-time');

// Tab 3: All Contacts
const allContactsList = document.getElementById('all-contacts-list');
const allContactsCount = document.getElementById('all-contacts-count');

// Tab 4: Inspector
const hashTableStatsBar = document.getElementById('hash-table-stats-bar');
const hashBucketMap = document.getElementById('hash-bucket-map');

// Toast container
const toastContainer = document.getElementById('toast-container');

/**
 * Initializes the application with preloaded sample data.
 */
function initApp() {
  loadPreloadedData();
  setupEventListeners();
  renderAllViews();
}

/**
 * Loads the initial 30 mock contacts.
 */
function loadPreloadedData() {
  // Reset existing
  directory.tree = new Tree();
  directory.hashTable = new HashTable(53);
  directory.contacts = [];
  directory.sortedContacts = [];

  for (let i = 0; i < PRELOADED_SAMPLE_DATA.length; i++) {
    const item = PRELOADED_SAMPLE_DATA[i];
    directory.addContact(item.name, item.phone, item.category);
  }

  showToast(`Preloaded 30 demo contacts with overlapping prefixes!`, 'success');
}

/**
 * Updates UI stats header and counts.
 */
function updateHeaderStats() {
  statTotalContacts.textContent = directory.contacts.length;
  statTreeNodes.textContent = directory.tree.nodeCount;
  statHashBuckets.textContent = directory.hashTable.capacity;
  allContactsCount.textContent = `${directory.contacts.length} Contacts`;
}

/**
 * Highlight matched prefix within a contact name.
 */
function highlightPrefix(name, prefix) {
  if (!prefix) return escapeHtml(name);
  const cleanPrefix = prefix.trim().toLowerCase();
  const lowerName = name.toLowerCase();

  const idx = lowerName.indexOf(cleanPrefix);
  if (idx === -1) {
    return escapeHtml(name);
  }

  const before = escapeHtml(name.substring(0, idx));
  const matched = escapeHtml(name.substring(idx, idx + cleanPrefix.length));
  const after = escapeHtml(name.substring(idx + cleanPrefix.length));

  return `${before}<mark class="highlight-match">${matched}</mark>${after}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper to get initials from a contact name.
 */
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Builds HTML for a single Contact Card.
 */
function createContactCardHtml(contact, matchedPrefix = '', dsaBadgeText = 'Stored in Tree & Hash Table', timeComplexity = 'O(1)') {
  const initials = getInitials(contact.name);
  const highlightedName = highlightPrefix(contact.name, matchedPrefix);
  const formattedPhone = `${contact.phone.slice(0, 5)} ${contact.phone.slice(5)}`;

  return `
    <div class="contact-card" data-id="${contact.id}" data-phone="${contact.phone}">
      <div>
        <div class="contact-top-row">
          <div class="contact-avatar">${initials}</div>
          <div class="contact-meta">
            <h4 class="contact-name" title="${escapeHtml(contact.name)}">${highlightedName}</h4>
            <span class="contact-category cat-${contact.category}">${contact.category}</span>
          </div>
        </div>

        <div class="contact-phone-row" style="margin-top: 0.75rem;">
          <span class="contact-phone-number">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            +91 ${formattedPhone}
          </span>
          <div class="phone-actions">
            <button class="btn-icon btn-lookup-phone" data-phone="${contact.phone}" title="Lookup in Hash Table O(1)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button class="btn-icon delete-btn btn-delete-contact" data-id="${contact.id}" data-name="${escapeHtml(contact.name)}" title="Delete Contact">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="contact-dsa-badge">
        <span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          ${dsaBadgeText}
        </span>
        <strong>${timeComplexity}</strong>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for empty states and hints.
 */
function createEmptyStateHtml(title, desc) {
  return `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </div>
      <h4 class="empty-title">${escapeHtml(title)}</h4>
      <p class="empty-desc">${escapeHtml(desc)}</p>
    </div>
  `;
}

/* ============================================================================
 * 9. TAB 1: TREE LIVE PREFIX SEARCH & EXACT BINARY SEARCH
 * ============================================================================ */

function handleNameSearchInput() {
  const query = nameSearchInput.value.trim();

  if (query.length > 0) {
    clearNameSearch.style.display = 'block';
  } else {
    clearNameSearch.style.display = 'none';
  }

  if (query.length === 0) {
    // Empty search: show all contacts sorted or default guidance
    telemetryAlgoTitle.textContent = "Tree Prefix Autocomplete";
    telemetryComplexity.textContent = "Time: O(L + K) | Space: O(N · L)";
    telemetryDescription.textContent = "Type any letter to trigger real-time Tree branch traversal. Prefix characters traverse Tree edges; subtree leaves yield matching contacts.";
    statPrefixLen.textContent = "0";
    statMatchedCount.textContent = directory.contacts.length;
    statSearchTime.textContent = "0.00 ms";

    resultsCountHeading.textContent = `All Directory Contacts (${directory.sortedContacts.length})`;
    resultsSubtext.textContent = "Sorted A-Z via Merge Sort";

    renderContactGrid(nameResultsList, directory.sortedContacts, '', 'Merge Sorted Array', 'O(1) Access');
    return;
  }

  // Execute Tree Prefix Search
  const { results, steps, nodesExplored, durationMs } = directory.searchPrefix(query);

  // Update telemetry
  telemetryAlgoTitle.textContent = "Tree Prefix Search (Autocomplete)";
  telemetryComplexity.textContent = `Time: O(L + K) | L=${query.length}, K=${nodesExplored}`;
  telemetryDescription.innerHTML = `Traversed <b>${steps} prefix edge(s)</b> in Tree to node <code>"${escapeHtml(query.toLowerCase())}"</code>, then explored <b>${nodesExplored} subtree node(s)</b> to gather all terminal contact leaves.`;
  statPrefixLen.textContent = query.length;
  statMatchedCount.textContent = results.length;
  statSearchTime.textContent = `${durationMs.toFixed(3)} ms`;

  resultsCountHeading.textContent = `Matched ${results.length} Contact(s)`;
  resultsSubtext.textContent = `Live Tree autocomplete for prefix "${query}"`;

  if (results.length === 0) {
    nameResultsList.innerHTML = createEmptyStateHtml(
      "No Contact Found",
      `No contacts in the Tree start with the prefix "${query}". Try another prefix like "Am", "An", or "Poo".`
    );
  } else {
    // Sort Tree results via Merge Sort for neat display
    const sortedMatches = mergeSort(results, (a, b) => compareContactsByName(a, b, true));
    renderContactGrid(nameResultsList, sortedMatches, query, `Tree Subtree Match`, 'O(L + K)');
  }
}

/**
 * Executes Binary Search for exact name match on sorted contacts array.
 */
function handleExactBinarySearch() {
  const query = nameSearchInput.value.trim();
  if (!query) {
    showToast("Please enter a name in the search box to perform Binary Search.", "info");
    nameSearchInput.focus();
    return;
  }

  const { contact, index, comparisons, found, durationMs } = directory.searchExactName(query);

  telemetryAlgoTitle.textContent = "Binary Search (Exact Name Match)";
  telemetryComplexity.textContent = `Time: O(log N) | Comparisons: ${comparisons}`;
  statPrefixLen.textContent = query.length;
  statMatchedCount.textContent = found ? 1 : 0;
  statSearchTime.textContent = `${durationMs.toFixed(3)} ms`;

  if (found) {
    telemetryDescription.innerHTML = `Binary Search located exact name <b>"${escapeHtml(contact.name)}"</b> at index <b>${index}</b> in <b>${comparisons} comparisons</b> on sorted array (N = ${directory.sortedContacts.length}). Log₂(N) &asymp; ${Math.ceil(Math.log2(directory.sortedContacts.length || 1))}.`;
    resultsCountHeading.textContent = `Exact Match Found (1 Contact)`;
    resultsSubtext.textContent = `Found via Binary Search at index [${index}]`;

    renderContactGrid(nameResultsList, [contact], query, `Binary Search Match (Index ${index})`, `O(log N)`);
    showToast(`Found "${contact.name}" in ${comparisons} comparison(s)!`, "success");
  } else {
    telemetryDescription.innerHTML = `Binary Search completed in <b>${comparisons} comparisons</b> across ${directory.sortedContacts.length} sorted contacts. Exact name "${escapeHtml(query)}" does not exist in directory.`;
    resultsCountHeading.textContent = `No Exact Match`;
    resultsSubtext.textContent = `Binary Search checked ${comparisons} midpoint(s)`;

    nameResultsList.innerHTML = createEmptyStateHtml(
      "No Exact Match Found",
      `Binary Search verified that exact name "${query}" is not present in the sorted contact array (checked in ${comparisons} comparisons).`
    );
    showToast(`No exact match for "${query}".`, "error");
  }
}

/* ============================================================================
 * 10. TAB 2: PHONE LOOKUP VIA HASH TABLE
 * ============================================================================ */

function handlePhoneSearch() {
  const rawInput = phoneSearchInput.value;
  const cleaned = cleanPhoneNumber(rawInput);

  if (rawInput.trim().length > 0) {
    clearPhoneSearch.style.display = 'block';
  } else {
    clearPhoneSearch.style.display = 'none';
  }

  // 1. Empty input state
  if (cleaned.length === 0) {
    statPhoneBucket.textContent = "-";
    statPhoneSteps.textContent = "0";
    statPhoneCollisions.textContent = "0";
    statPhoneTime.textContent = "0.00 ms";
    phoneResultCardContainer.innerHTML = createEmptyStateHtml(
      "Enter a Phone Number",
      "Type a 10-digit mobile number above to perform an instantaneous O(1) Hash Table lookup."
    );
    return;
  }

  // 2. Fewer than 10 digits typed: show helpful hint, NOT an error or not-found
  if (cleaned.length < 10) {
    statPhoneBucket.textContent = "-";
    statPhoneSteps.textContent = "0";
    statPhoneCollisions.textContent = "0";
    statPhoneTime.textContent = "0.00 ms";
    phoneResultCardContainer.innerHTML = createEmptyStateHtml(
      "Enter 10 Digits",
      `Please enter a full 10-digit mobile number (${cleaned.length}/10 digits entered).`
    );
    return;
  }

  // 3. Search key: normalize to 10-digit string
  const searchKey = cleaned.slice(0, 10);
  const { contact, bucketIndex, steps, chainLength, collisions, durationMs } = directory.searchPhone(searchKey);

  // Requirement 8: Show bucket index, chain length and search latency in the panel
  statPhoneBucket.textContent = `#${bucketIndex}`;
  statPhoneSteps.textContent = chainLength;
  statPhoneCollisions.textContent = collisions;
  statPhoneTime.textContent = `${durationMs.toFixed(3)} ms`;

  if (contact) {
    phoneResultCardContainer.innerHTML = createContactCardHtml(
      contact,
      '',
      `Hash Bucket #${bucketIndex} (Chain length: ${chainLength}, Step: ${steps})`,
      'O(1) Avg'
    );
  } else {
    // Requirement 7: Show "No contact found" message when there is no match
    const formattedPhone = `${searchKey.slice(0, 5)} ${searchKey.slice(5)}`;
    phoneResultCardContainer.innerHTML = createEmptyStateHtml(
      "No Contact Found",
      `No contact with phone number "+91 ${formattedPhone}" exists in the directory.`
    );
  }
}

/* ============================================================================
 * 11. TAB 3: ALL CONTACTS (MERGE SORTED)
 * ============================================================================ */

function renderAllContactsTab() {
  const ascending = sortDirectionSelect.value === 'asc';
  directory.refreshSortedList(ascending);

  if (directory.sortedContacts.length === 0) {
    allContactsList.innerHTML = createEmptyStateHtml(
      "Directory Empty",
      "No contacts found. Use the 'Add New Contact' form or click '+10 Random Contacts' to load demo data."
    );
    return;
  }

  renderContactGrid(
    allContactsList,
    directory.sortedContacts,
    '',
    `Merge Sorted (${ascending ? 'A-Z' : 'Z-A'})`,
    'O(N log N)'
  );

  updateHeaderStats();
}

/**
 * Generic renderer for contact card lists.
 */
function renderContactGrid(container, contacts, prefix = '', dsaText = '', complexity = '') {
  let html = '';
  for (let i = 0; i < contacts.length; i++) {
    html += createContactCardHtml(contacts[i], prefix, dsaText, complexity);
  }
  container.innerHTML = html;
}

/* ============================================================================
 * 12. TAB 4: DSA INSPECTOR & HASH BUCKET VISUALIZER
 * ============================================================================ */

function renderHashInspector() {
  const diag = directory.hashTable.getDiagnostics();

  // 1. Stats bar
  hashTableStatsBar.innerHTML = `
    <div class="hash-stat-box">
      <span class="hash-stat-label">Capacity (Buckets)</span>
      <span class="hash-stat-val">${diag.capacity}</span>
    </div>
    <div class="hash-stat-box">
      <span class="hash-stat-label">Keys Stored</span>
      <span class="hash-stat-val">${diag.size}</span>
    </div>
    <div class="hash-stat-box">
      <span class="hash-stat-label">Load Factor (&lambda;)</span>
      <span class="hash-stat-val">${diag.loadFactor}</span>
    </div>
    <div class="hash-stat-box">
      <span class="hash-stat-label">Occupied Buckets</span>
      <span class="hash-stat-val">${diag.filledBuckets}</span>
    </div>
    <div class="hash-stat-box">
      <span class="hash-stat-label">Buckets with Collisions</span>
      <span class="hash-stat-val" style="color: #ea580c;">${diag.collisionBuckets}</span>
    </div>
    <div class="hash-stat-box">
      <span class="hash-stat-label">Max Chain Length</span>
      <span class="hash-stat-val">${diag.maxChainLength}</span>
    </div>
  `;

  // 2. Bucket visual grid
  let gridHtml = '';
  for (let i = 0; i < diag.capacity; i++) {
    const len = diag.bucketLengths[i];
    let cssClass = 'empty';
    if (len === 1) cssClass = 'filled-1';
    else if (len > 1) cssClass = 'filled-collision';

    gridHtml += `
      <div class="bucket-cell ${cssClass}" title="Bucket #${i}: ${len} contact(s) chained" data-bucket="${i}">
        <span class="bucket-idx">[${i}]</span>
        <span class="bucket-count">${len}</span>
      </div>
    `;
  }

  hashBucketMap.innerHTML = gridHtml;
}

/* ============================================================================
 * 13. FORM HANDLING: ADD CONTACT
 * ============================================================================ */

function handleAddContactSubmit(e) {
  e.preventDefault();
  formErrorMsg.style.display = 'none';

  const name = contactNameInput.value.trim();
  const phone = contactPhoneInput.value.trim();
  const category = contactCategorySelect.value;

  if (!name || !phone) {
    showFormError("Both name and phone number are required.");
    return;
  }

  try {
    const newContact = directory.addContact(name, phone, category);

    // Reset form
    addContactForm.reset();
    contactCategorySelect.value = "College";

    showToast(`Added "${newContact.name}" (+91 ${newContact.phone})!`, "success");

    // Refresh active views
    renderAllViews();
  } catch (err) {
    showFormError(err.message);
    showToast(err.message, "error");
  }
}

function showFormError(msg) {
  formErrorMsg.textContent = msg;
  formErrorMsg.style.display = 'block';
}

/* ============================================================================
 * 14. DELETION HANDLING
 * ============================================================================ */

function handleDeleteContact(contactId, contactName) {
  const confirmed = confirm(`Are you sure you want to delete "${contactName}"?\nThis will remove it from Tree, Hash Table, and sorted directory.`);
  if (!confirmed) return;

  const success = directory.deleteContact(contactId);
  if (success) {
    showToast(`Deleted "${contactName}" from all data structures.`, "info");
    renderAllViews();
  } else {
    showToast("Error deleting contact.", "error");
  }
}

/* ============================================================================
 * 15. RANDOM CONTACT GENERATOR (+10)
 * ============================================================================ */

function handleLoadMoreRandom() {
  let addedCount = 0;
  for (let i = 0; i < 10; i++) {
    const firstName = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
    const lastName = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;
    const phone = generateRandomPhoneNumber(directory);
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    try {
      directory.addContact(fullName, phone, category);
      addedCount++;
    } catch (err) {
      // Ignore random collision and continue
    }
  }

  showToast(`Successfully added ${addedCount} random Indian contacts!`, "success");
  renderAllViews();
}

/* ============================================================================
 * 16. TOAST NOTIFICATIONS & VIEW REFRESH
 * ============================================================================ */

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
  raf(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

function renderAllViews() {
  updateHeaderStats();
  handleNameSearchInput();
  handlePhoneSearch();
  renderAllContactsTab();
  renderHashInspector();
}

/* ============================================================================
 * 17. EVENT LISTENERS
 * ============================================================================ */

function setupEventListeners() {
  // Add Contact Form
  addContactForm.addEventListener('submit', handleAddContactSubmit);

  // Phone input in Add Contact form (accept digits only)
  contactPhoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  // Phone Search input: runs on 'input' event as user types, and on 'Enter'
  phoneSearchInput.addEventListener('input', () => {
    handlePhoneSearch();
  });
  phoneSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePhoneSearch();
    }
  });

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(`tab-${targetTab}`);
      if (activeContent) activeContent.classList.add('active');

      if (targetTab === 'all-contacts') {
        renderAllContactsTab();
      } else if (targetTab === 'dsa-inspector') {
        renderHashInspector();
      }
    });
  });

  // Name Search input (real-time Tree prefix search)
  nameSearchInput.addEventListener('input', handleNameSearchInput);
  clearNameSearch.addEventListener('click', () => {
    nameSearchInput.value = '';
    handleNameSearchInput();
    nameSearchInput.focus();
  });

  // Exact Name Binary Search
  btnExactBinarySearch.addEventListener('click', handleExactBinarySearch);
  nameSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExactBinarySearch();
    }
  });

  // Phone Search Button & Clear
  btnHashSearch.addEventListener('click', handlePhoneSearch);
  clearPhoneSearch.addEventListener('click', () => {
    phoneSearchInput.value = '';
    handlePhoneSearch();
    phoneSearchInput.focus();
  });

  // Prefix Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prefix = chip.getAttribute('data-prefix');
      nameSearchInput.value = prefix;
      handleNameSearchInput();
      nameSearchInput.focus();
    });
  });

  // Demo Controls
  btnLoadMore.addEventListener('click', handleLoadMoreRandom);
  btnResetData.addEventListener('click', () => {
    if (confirm("Reset directory back to default 30 sample contacts?")) {
      loadPreloadedData();
      renderAllViews();
    }
  });

  // Sort direction & re-run Merge Sort
  sortDirectionSelect.addEventListener('change', renderAllContactsTab);
  btnReMergeSort.addEventListener('click', () => {
    const res = directory.refreshSortedList(sortDirectionSelect.value === 'asc');
    renderAllContactsTab();
    showToast(`Merge Sort completed in ${res.durationMs.toFixed(3)} ms (N = ${res.count}).`, "success");
  });

  // Delegation for contact card actions (Delete, Phone Lookup)
  document.addEventListener('click', (e) => {
    // Delete contact button
    const deleteBtn = e.target.closest('.btn-delete-contact');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const name = deleteBtn.getAttribute('data-name');
      handleDeleteContact(id, name);
      return;
    }

    // Phone quick lookup button
    const lookupBtn = e.target.closest('.btn-lookup-phone');
    if (lookupBtn) {
      const phone = lookupBtn.getAttribute('data-phone');
      // Switch to phone tab
      const phoneTabBtn = document.getElementById('tab-btn-phone');
      if (phoneTabBtn) phoneTabBtn.click();
      phoneSearchInput.value = phone;
      handlePhoneSearch();
      return;
    }

    // Click on bucket in Inspector to filter/highlight
    const bucketCell = e.target.closest('.bucket-cell');
    if (bucketCell) {
      const bIdx = parseInt(bucketCell.getAttribute('data-bucket'), 10);
      const chainNodes = [];
      let curr = directory.hashTable.buckets[bIdx];
      while (curr) {
        chainNodes.push(`${curr.value.name} (+91 ${curr.key})`);
        curr = curr.next;
      }
      if (chainNodes.length === 0) {
        showToast(`Bucket #${bIdx} is empty (0 collisions).`, "info");
      } else {
        showToast(`Bucket #${bIdx} holds ${chainNodes.length} contact(s): ${chainNodes.join(', ')}`, "info");
      }
    }
  });
}

// Start application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
