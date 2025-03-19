import React, { useEffect, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { fetchUsers, fetchPosts, apolloClient } from "./api";
import { gql } from "@apollo/client";

const POST_ADDED_SUBSCRIPTION = gql`
  subscription {
    postAdded {
      id
      title
      content
    }
  }
`;

const PostUserTable = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const users = await fetchUsers();
      const posts = await fetchPosts();

      const mergedData = posts.posts.map(post => ({
        ...post,
        user: users.users.find(user => user.id === post.userId)?.name || "Unknown"
      }));

      setData(mergedData);
    };

    loadData();

    // Subscribe to new posts
    const subscription = apolloClient
      .subscribe({ query: POST_ADDED_SUBSCRIPTION })
      .subscribe({
        next({ data: { postAdded } }) {
          setData(prevData => [
            ...prevData,
            { ...postAdded, user: "Unknown" } // Update user later
          ]);
        },
        error(err) {
          console.error("Subscription error", err);
        }
      });

    return () => subscription.unsubscribe(); // Clean up on unmount
  }, []);

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "content", header: "Content" },
    { accessorKey: "user", header: "User" }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PostUserTable;
