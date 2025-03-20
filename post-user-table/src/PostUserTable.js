import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { fetchUsers, fetchPosts, apolloClient } from "./api";
import { gql } from "@apollo/client";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Box,
  TablePagination,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

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
  const [expandedRow, setExpandedRow] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const loadData = async () => {
      const users = await fetchUsers();
      const posts = await fetchPosts();

      const mergedData = posts.posts.map((post) => ({
        ...post,
        user: users.users.find((user) => user.id === post.userId)?.name || "Unknown",
      }));

      setData(mergedData);
    };

    loadData();

    const subscription = apolloClient
      .subscribe({ query: POST_ADDED_SUBSCRIPTION })
      .subscribe({
        next({ data: { postAdded } }) {
          setData((prevData) => [
            ...prevData,
            { ...postAdded, user: "Unknown" },
          ]);
        },
        error(err) {
          console.error("Subscription error", err);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "content", header: "Content" },
    { accessorKey: "user", header: "User" },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExpandClick = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxWidth: 800,
        margin: "auto",
        marginTop: 4,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" component="div" sx={{ padding: 2 }}>
        Posts Per User
      </Typography>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              <TableCell />
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table
            .getRowModel()
            .rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    "&:hover": { backgroundColor: "#f1f1f1" },
                  }}
                >
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => handleExpandClick(row.id)}
                    >
                      {expandedRow === row.id ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
                  >
                    <Collapse
                      in={expandedRow === row.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={1}>
                        <Typography variant="body1" gutterBottom>
                          Detailed Information
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {row.original.content}
                        </Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={table.getRowModel().rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default PostUserTable;
