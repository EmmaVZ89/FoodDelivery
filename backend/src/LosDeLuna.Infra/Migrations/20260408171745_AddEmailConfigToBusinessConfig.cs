using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosDeLuna.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailConfigToBusinessConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailFrom",
                table: "business_config",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailFromName",
                table: "business_config",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "business_config",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "EmailFrom", "EmailFromName" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailFrom",
                table: "business_config");

            migrationBuilder.DropColumn(
                name: "EmailFromName",
                table: "business_config");
        }
    }
}
