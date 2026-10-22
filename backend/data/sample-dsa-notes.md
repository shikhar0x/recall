# Data Structures and Algorithms — Class Notes

## Linear Search
Linear search scans a collection element by element until the target is found
or the list ends. Time complexity is O(n) in the worst case and O(1) in the
best case. Space complexity is O(1) because no extra storage is needed.

## Insertion Sort
Insertion sort builds a sorted prefix one element at a time. Each new element
is compared with the sorted prefix and shifted right until its correct slot is
found. Worst and average case time complexity is O(n squared), best case is
O(n) for nearly sorted input, and auxiliary space is O(1). Insertion sort is
stable and works very well on small or nearly sorted arrays.

## Recursion
A recursive method solves a problem by calling itself on a smaller input and
combining the results. Every recursion needs a base case to stop and a
recursive case that moves toward the base case. Classic examples include
factorial, Fibonacci numbers, and tree traversals.

## Big-O Notation
Big-O describes how running time grows with input size. Common classes from
fastest to slowest are O(1), O(log n), O(n), O(n log n), O(n squared) and
O(2 to the power n). Constant factors are ignored.

## ArrayList vs Arrays
Arrays have a fixed length and very fast index access. An ArrayList wraps an
array, grows automatically when it is full and exposes methods such as add,
get, remove and size. Random access on an ArrayList is still O(1).
