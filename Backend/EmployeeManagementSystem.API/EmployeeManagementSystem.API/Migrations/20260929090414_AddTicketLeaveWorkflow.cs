using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketLeaveWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LeaveId",
                table: "Tickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Tickets",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_LeaveId",
                table: "Tickets",
                column: "LeaveId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Leaves_LeaveId",
                table: "Tickets",
                column: "LeaveId",
                principalTable: "Leaves",
                principalColumn: "LeaveId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Leaves_LeaveId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_LeaveId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "LeaveId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Tickets");
        }
    }
}
