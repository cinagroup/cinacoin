import { expect } from "chai";
import { ethers } from "hardhat";
import { HTLC } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HTLC Contract", function () {
  let htlc: HTLC;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;

  const TEST_SECRET = ethers.keccak256(ethers.toUtf8Bytes("my-secret-preimage"));
  const HASHLOCK = ethers.keccak256(TEST_SECRET);

  const ERC20_TOKEN_MOCK = "0x1234567890123456789012345678901234567890";

  before(async () => {
    [alice, bob, charlie] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const HTLCFactory = await ethers.getContractFactory("HTLC");
    htlc = await HTLCFactory.deploy();
    await htlc.waitForDeployment();
  });

  // ── 1. Deployment Tests ──────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should initialize with zero lockCount", async () => {
      expect(await htlc.lockCount()).to.equal(0);
    });
  });

  // ── 2. ETH Lock Creation Tests ───────────────────────────────────────

  describe("create() - ETH Locks", function () {
    it("Should create an ETH lock with correct parameters", async () => {
      const amount = ethers.parseEther("1.0");
      const timelock = (await time.latest()) + 3600;

      const tx = await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, amount, {
          value: amount,
        });

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const lock = await htlc.getLock(0);
      expect(lock.sender).to.equal(alice.address);
      expect(lock.recipient).to.equal(bob.address);
      expect(lock.token).to.equal(ethers.ZeroAddress);
      expect(lock.amount).to.equal(amount);
      expect(lock.hashlock).to.equal(HASHLOCK);
      expect(lock.timelock).to.equal(timelock);
      expect(lock.claimed).to.equal(false);
      expect(await htlc.lockCount()).to.equal(1);
    });

    it("Should emit Locked event", async () => {
      const amount = ethers.parseEther("1.0");
      const timelock = (await time.latest()) + 3600;

      await expect(
        htlc
          .connect(alice)
          .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, amount, {
            value: amount,
          })
      )
        .to.emit(htlc, "Locked")
        .withArgs(
          0,
          alice.address,
          bob.address,
          ethers.ZeroAddress,
          amount,
          HASHLOCK,
          timelock
        );
    });

    it("Should revert if msg.value != amount for native ETH", async () => {
      const amount = ethers.parseEther("1.0");
      const timelock = (await time.latest()) + 3600;

      await expect(
        htlc
          .connect(alice)
          .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, amount, {
            value: ethers.parseEther("0.5"), // Wrong amount
          })
      ).to.be.revertedWithCustomError(htlc, "InsufficientFunds");
    });

    it("Should revert if timelock is in the past", async () => {
      const amount = ethers.parseEther("1.0");
      const pastTimelock = (await time.latest()) - 100;

      await expect(
        htlc
          .connect(alice)
          .create(bob.address, HASHLOCK, pastTimelock, ethers.ZeroAddress, amount, {
            value: amount,
          })
      ).to.be.revertedWithCustomError(htlc, "InsufficientFunds");
    });

    it("Should revert if recipient is zero address", async () => {
      const amount = ethers.parseEther("1.0");
      const timelock = (await time.latest()) + 3600;

      await expect(
        htlc
          .connect(alice)
          .create(ethers.ZeroAddress, HASHLOCK, timelock, ethers.ZeroAddress, amount, {
            value: amount,
          })
      ).to.be.revertedWithCustomError(htlc, "ZeroRecipient");
    });

    it("Should revert if hashlock is zero", async () => {
      const amount = ethers.parseEther("1.0");
      const timelock = (await time.latest()) + 3600;

      await expect(
        htlc
          .connect(alice)
          .create(bob.address, ethers.ZeroHash, timelock, ethers.ZeroAddress, amount, {
            value: amount,
          })
      ).to.be.revertedWithCustomError(htlc, "ZeroHashlock");
    });

    it("Should revert if amount is zero", async () => {
      const timelock = (await time.latest()) + 3600;

      await expect(
        htlc
          .connect(alice)
          .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, 0, {
            value: 0,
          })
      ).to.be.revertedWithCustomError(htlc, "ZeroAmount");
    });

    it("Should allow multiple locks with incrementing IDs", async () => {
      const amount = ethers.parseEther("0.5");
      const timelock = (await time.latest()) + 7200;

      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, amount, {
          value: amount,
        });

      const hashlock2 = ethers.keccak256(ethers.toUtf8Bytes("second-secret"));
      await htlc
        .connect(alice)
        .create(charlie.address, hashlock2, timelock, ethers.ZeroAddress, amount, {
          value: amount,
        });

      expect(await htlc.lockCount()).to.equal(2);

      const lock0 = await htlc.getLock(0);
      const lock1 = await htlc.getLock(1);
      expect(lock0.recipient).to.equal(bob.address);
      expect(lock1.recipient).to.equal(charlie.address);
    });
  });

  // ── 3. ETH Claim Tests ───────────────────────────────────────────────

  describe("claim() - ETH Claims", function () {
    const LOCK_AMOUNT = ethers.parseEther("1.0");

    beforeEach(async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });
    });

    it("Should allow the recipient to claim with correct secret", async () => {
      const bobBalanceBefore = await ethers.provider.getBalance(bob.address);

      const tx = await htlc.connect(bob).claim(0, TEST_SECRET);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const bobBalanceAfter = await ethers.provider.getBalance(bob.address);

      // Bob should have received the locked amount (minus gas)
      expect(bobBalanceAfter + gasUsed - bobBalanceBefore).to.equal(LOCK_AMOUNT);
    });

    it("Should emit Claimed event", async () => {
      await expect(htlc.connect(bob).claim(0, TEST_SECRET))
        .to.emit(htlc, "Claimed")
        .withArgs(0, TEST_SECRET, bob.address);
    });

    it("Should mark the lock as claimed after claim", async () => {
      await htlc.connect(bob).claim(0, TEST_SECRET);
      const lock = await htlc.getLock(0);
      expect(lock.claimed).to.equal(true);
    });

    it("Should mark the secret as revealed", async () => {
      await htlc.connect(bob).claim(0, TEST_SECRET);
      expect(await htlc.isSecretRevealed(HASHLOCK)).to.equal(true);
    });

    it("Should revert if wrong secret is provided", async () => {
      const wrongSecret = ethers.keccak256(ethers.toUtf8Bytes("wrong-secret"));
      await expect(htlc.connect(bob).claim(0, wrongSecret))
        .to.be.revertedWithCustomError(htlc, "InvalidSecret");
    });

    it("Should revert if already claimed", async () => {
      await htlc.connect(bob).claim(0, TEST_SECRET);
      await expect(htlc.connect(bob).claim(0, TEST_SECRET))
        .to.be.revertedWithCustomError(htlc, "AlreadyClaimed");
    });

    it("Should revert on non-existent lock ID", async () => {
      await expect(htlc.connect(bob).claim(999, TEST_SECRET))
        .to.be.revertedWithCustomError(htlc, "LockDoesNotExist");
    });

    it("Should prevent double-spend of same hashlock", async () => {
      // Create a second lock with the same hashlock
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      // Claim first lock
      await htlc.connect(bob).claim(0, TEST_SECRET);

      // Second lock with same hashlock should fail
      await expect(htlc.connect(bob).claim(1, TEST_SECRET))
        .to.be.revertedWithCustomError(htlc, "SecretAlreadyRevealed");
    });
  });

  // ── 4. ETH Refund Tests ──────────────────────────────────────────────

  describe("refund() - ETH Refunds", function () {
    const LOCK_AMOUNT = ethers.parseEther("1.0");

    it("Should allow refund after timelock expires", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);

      // Advance time past timelock
      await time.increaseTo(timelock + 100);

      const tx = await htlc.connect(alice).refund(0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);

      // Alice should get the locked amount back (minus gas)
      expect(aliceBalanceAfter + gasUsed - aliceBalanceBefore).to.equal(LOCK_AMOUNT);
    });

    it("Should emit Refunded event", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      await time.increaseTo(timelock + 100);

      await expect(htlc.connect(alice).refund(0))
        .to.emit(htlc, "Refunded")
        .withArgs(0, alice.address);
    });

    it("Should revert if timelock has not expired", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      // Don't advance time
      await expect(htlc.connect(alice).refund(0))
        .to.be.revertedWithCustomError(htlc, "TimelockNotExpired");
    });

    it("Should revert if someone other than the sender tries to refund", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      await time.increaseTo(timelock + 100);

      await expect(htlc.connect(bob).refund(0))
        .to.be.revertedWithCustomError(htlc, "Unauthorized");
    });

    it("Should revert if lock was already claimed", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      await htlc.connect(bob).claim(0, TEST_SECRET);

      await time.increaseTo(timelock + 100);

      await expect(htlc.connect(alice).refund(0))
        .to.be.revertedWithCustomError(htlc, "AlreadyClaimed");
    });

    it("Should return correct refund time remaining", async () => {
      const timelock = (await time.latest()) + 3600;
      await htlc
        .connect(alice)
        .create(bob.address, HASHLOCK, timelock, ethers.ZeroAddress, LOCK_AMOUNT, {
          value: LOCK_AMOUNT,
        });

      const timeLeft = await htlc.getRefundTimeLeft(0);
      expect(Number(timeLeft)).to.be.approximately(3600, 10);
    });
  });

  // ── 5. Atomic Swap Simulation ────────────────────────────────────────

  describe("Atomic Swap (Two-Party)", function () {
    it("Should complete a full atomic swap between Alice and Bob", async () => {
      const secret = ethers.keccak256(ethers.toUtf8Bytes("atomic-swap-secret"));
      const hashlock = ethers.keccak256(secret);
      const amount = ethers.parseEther("2.0");
      const timelock = (await time.latest()) + 7200;

      // Alice locks funds for Bob
      await htlc
        .connect(alice)
        .create(bob.address, hashlock, timelock, ethers.ZeroAddress, amount, {
          value: amount,
        });

      // Bob claims with the secret
      await htlc.connect(bob).claim(0, secret);

      const lock = await htlc.getLock(0);
      expect(lock.claimed).to.equal(true);
      expect(await htlc.isSecretRevealed(hashlock)).to.equal(true);
    });

    it("Should allow refund if claim never happens", async () => {
      const secret = ethers.keccak256(ethers.toUtf8Bytes("never-revealed"));
      const hashlock = ethers.keccak256(secret);
      const amount = ethers.parseEther("0.5");
      const timelock = (await time.latest()) + 3600;

      await htlc
        .connect(alice)
        .create(bob.address, hashlock, timelock, ethers.ZeroAddress, amount, {
          value: amount,
        });

      // Advance past timelock
      await time.increaseTo(timelock + 100);

      // Alice refunds
      await htlc.connect(alice).refund(0);

      const lock = await htlc.getLock(0);
      expect(lock.claimed).to.equal(true);
    });
  });

  // ── 6. Edge Cases ────────────────────────────────────────────────────

  describe("Edge Cases", function () {
    it("Should accept ETH via receive()", async () => {
      await alice.sendTransaction({
        to: await htlc.getAddress(),
        value: ethers.parseEther("0.1"),
      });

      expect(await ethers.provider.getBalance(await htlc.getAddress())).to.equal(
        ethers.parseEther("0.1")
      );
    });

    it("Should allow emergency withdrawal", async () => {
      await alice.sendTransaction({
        to: await htlc.getAddress(),
        value: ethers.parseEther("0.1"),
      });

      const balanceBefore = await ethers.provider.getBalance(alice.address);
      const tx = await htlc.connect(alice).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(alice.address);
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(ethers.parseEther("0.1"));
    });

    it("Should prevent refund on non-existent lock", async () => {
      await expect(htlc.connect(alice).refund(999))
        .to.be.revertedWithCustomError(htlc, "LockDoesNotExist");
    });

    it("Should prevent getRefundTimeLeft on non-existent lock", async () => {
      await expect(htlc.getRefundTimeLeft(999))
        .to.be.revertedWithCustomError(htlc, "LockDoesNotExist");
    });
  });
});
